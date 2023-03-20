import { CommonConstants } from '../constants/common.constants';
import type { CommonTypes } from '../types/common.types';
import { CommonUtils } from '../utils/common.utils';
import * as psl from 'psl';
import type { Chains, Networks } from '../lib/node-multiplexer';

// Can be implemented by using different SQL like databases
export abstract class DatabaseInterface {
  // Overridden in database implementation class
  abstract runQuery({ query, database }: { query: string; database: string });

  async getMaliciousCounterpartyDetails(
    address: string,
    chain: Chains,
    network: Networks
  ): Promise<CommonTypes.DatasetMaliciousCounterparty[]> {
    const columns = [
      CommonConstants.DATABASE_COLUMNS.ADDRESS,
      CommonConstants.DATABASE_COLUMNS.TAGS,
      CommonConstants.DATABASE_COLUMNS.LABELS,
      CommonConstants.DATABASE_COLUMNS.CONTRACT_CREATOR,
    ];

    const query = `
      SELECT ${columns}
        FROM ${CommonConstants.DATABASE_TABLES.MALICIOUS_COUNTERPARTY} 
        WHERE lower(address)='${address.toLowerCase()}' OR lower(contract_creator)='${address.toLowerCase()}'
      `;

    const maliciousCounterpartyDetails = await this.runQuery({
      query,
      database: CommonConstants.DATABASE_NAMES[`${chain}_${network}`],
    });

    return maliciousCounterpartyDetails as CommonTypes.DatasetMaliciousCounterparty[];
  }

  async getMaliciousDomainDetails(
    addresses: string[],
    columns: string[]
  ): Promise<CommonTypes.DatasetMaliciousDomains[]> {
    const mappedAddresses = addresses.map((a) => `'${a}'`).join(',');

    const query = `
      SELECT ${columns} 
        FROM ${CommonConstants.DATABASE_TABLES.MALICIOUS_DOMAINS} 
        WHERE hasAny([url],[${mappedAddresses}])`;

    const maliciousDomainDetails = await this.runQuery({
      query,
      database: CommonConstants.DATABASE_NAMES.DATASET,
    });

    return maliciousDomainDetails as CommonTypes.DatasetMaliciousDomains[];
  }

  async getFuzzyMaliciousDomainDetails(
    address: string,
    columns: string[]
  ): Promise<CommonTypes.DatasetAllowedDomains[]> {
    try {
      const pslParsedDomain = psl.parse(address);
      const sourceSLD = pslParsedDomain.sld.toLowerCase();
      const fuzzySourceSLDPatterns = CommonUtils.generateFuzzySLDPatterns(sourceSLD);
      const shortestFuzzySLDPattern = fuzzySourceSLDPatterns.reduce((shortest, str) =>
        str.length < shortest.length ? str : shortest
      );

      const prefixSuffixSearchQuery = `
      SELECT ${columns} 
        FROM ${CommonConstants.DATABASE_TABLES.ALLOWLIST_DOMAINS} 
        WHERE ${fuzzySourceSLDPatterns
          .flatMap((pattern) => ["sld ILIKE '%" + pattern + "'", "sld ILIKE '" + pattern + "%'"])
          .join(' OR ')} 
        LIMIT ${CommonConstants.MAX_FUZZY_MATCHES}`;

      const fuzzySearchQuery = `
        SELECT ${columns.join(', ')} 
          FROM ${CommonConstants.DATABASE_TABLES.ALLOWLIST_DOMAINS} 
          WHERE 
            (
              multiFuzzyMatchAny
                (
                  ${CommonConstants.DATABASE_COLUMNS.SLD}, 
                  ${Math.floor(
                    CommonConstants.MAX_MATCHING_FUZZINESS * shortestFuzzySLDPattern.length
                  )}, 
                  ['${fuzzySourceSLDPatterns.join("', '")}']
                ) 
              AND 
                length(${CommonConstants.DATABASE_COLUMNS.SLD}) 
                  <=
                ${
                  sourceSLD.length +
                  Math.floor(CommonConstants.MAX_MATCHING_FUZZINESS * sourceSLD.length)
                }
            ) 
          LIMIT ${CommonConstants.MAX_FUZZY_MATCHES}
      `;

      const prefixSuffixSearchQueryPromise = this.runQuery({
        query: prefixSuffixSearchQuery,
        database: CommonConstants.DATABASE_NAMES.DATASET,
      });

      const fuzzySearchQueryPromise = this.runQuery({
        query: fuzzySearchQuery,
        database: CommonConstants.DATABASE_NAMES.DATASET,
      });

      const [fuzzyMatchedDomains, prefixSuffixMatchedDomains] = await Promise.all([
        fuzzySearchQueryPromise,
        prefixSuffixSearchQueryPromise,
      ]);

      const computedEditDistances = new Map<string, number>();
      const sourceSLDLength = sourceSLD.length;
      const queryResults = fuzzyMatchedDomains as CommonTypes.DatasetAllowedDomains[];
      queryResults.push(...(prefixSuffixMatchedDomains as CommonTypes.DatasetAllowedDomains[]));
      const filteredMatches = queryResults.filter((fuzzyMatchedDomain) => {
        const fuzzyMatchedSLD = fuzzyMatchedDomain.sld.toLowerCase();
        if (fuzzyMatchedSLD === sourceSLD || fuzzySourceSLDPatterns.includes(fuzzyMatchedSLD)) {
          computedEditDistances.set(fuzzyMatchedSLD, 0);
          return true;
        }
        if (
          (fuzzyMatchedSLD.length <= sourceSLDLength * 2 && fuzzyMatchedSLD.includes(sourceSLD)) ||
          sourceSLD.includes(fuzzyMatchedSLD)
        ) {
          computedEditDistances.set(
            fuzzyMatchedSLD,
            CommonUtils.computeEditDistance(sourceSLD, fuzzyMatchedSLD)
          );
          return true;
        }
        const edDelta = CommonUtils.computeEditDistance(sourceSLD, fuzzyMatchedSLD);
        if (edDelta <= Math.floor(sourceSLDLength * CommonConstants.MAX_MATCHING_FUZZINESS)) {
          computedEditDistances.set(fuzzyMatchedSLD, edDelta);
          return true;
        }
        return false;
      });
      const finalMatches = filteredMatches.sort(
        (matchA, matchB) =>
          computedEditDistances.get(matchA.sld.toLowerCase()) -
          computedEditDistances.get(matchB.sld.toLowerCase())
      );
      computedEditDistances.clear();
      return finalMatches.slice(0, CommonConstants.MAX_FUZZY_RESULTS);
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async getAllowedDomainDetails(
    addresses: string[],
    requiredColumns: string[]
  ): Promise<CommonTypes.DatasetAllowedDomains[]> {
    const mappedAddresses = addresses.map((a) => `'${a}'`).join(',');
    const query = `
      SELECT ${requiredColumns.join(', ')} 
        FROM ${CommonConstants.DATABASE_TABLES.ALLOWLIST_DOMAINS} 
        WHERE hasAny([url],[${mappedAddresses}])
        `;

    const allowedDomainDetails = await this.runQuery({
      query,
      database: CommonConstants.DATABASE_NAMES.DATASET,
    });

    return allowedDomainDetails as CommonTypes.DatasetAllowedDomains[];
  }
}
