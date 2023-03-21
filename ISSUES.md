# Issues

## Guidelines

- Every issue will be mapped with a single Pull Request (i.e 1 Pull Request for 1 Issue)
- Go through the open issues (filter with `Status: TODO`, and `Domain: XXXXXX`), to check if your issue has been already been addressed earlier
- If an existing issue doesn't exist, please go through the Issue Lifecycle first to understand about the stages an issue goes through
- Lastly, to create a new issue, please visit the [Issues Section](https://github.com/Arda-finance/olynthus/issues)

## Issue Lifecycle

### Stage 1

- Someone opens an issue
- Label to use: `Type: XXXXXXX` (Type of issue from the perspective of person addressing it)
- Please note that you only use the following labels with prefix `Type: XXXXX`. Other labels will be assigned by the team in the next steps accordingly.
- We have an Issue template for each of the issue type.Please make sure to use it accordingly.
- Issues can be of the following types,
  - `Type: Bug` - Something isn't working
  - `Type: Discussion` - A discussion
  - `Type: Documentation` - Documentation
  - `Type: Feature Request` - A new feature/functionality
  - `Type: Question` - Query/question regarding the product/code
  - `Type: Security` - Vulnerability/security related issue

### Stage 2

- A member will go through the issue and accordingly will add another label `Resolution: XXXXXX` i.e it has been attended to
- Types of resolutions:

  - `Resolution: Backlog` - This issue has been confirmed earlier, and is in the tasks TODO list
  - `Resolution: Duplicate` - This issue has been addressed earlier
  - `Resolution: Expected Behavior` - Not a concern, as we intended the product work in this manner
  - `Resolution: Need Help` - This issue has been validated by the team, and needs help from the community to make progress
  - `Resolution: Needs More Information` - This issue requires more details/context/information for the next steps
  - `Resolution: Out of Scope` - This issue is currently is outside of the product vision
  - `Resolution: Confirmed` - This issue has been validated by the team, and can progress to next steps
  - `Resolution: Resolved` - This issue has been resolved, and hence closed!
  - `Resolution: Stale` - This issue has been marked as inactive due to no activity

### Stage 3

- Once an Issue is confirmed by `Resolution: Confirmed`, it goes to the next step i.e making the changes required.
- The team will assign the issue to anyone who is willing to make the necessary changes
- The team will also assign new labels to the issue accordingly. Following are the labels assigned at this stage,

  - Core Team

    - `Core Team` - Will be handled by Olynthus' core team

  - Vision:

    - `Vision: Coverage` - What more cases should the product handle/cover?
    - `Vision: Tech` - What part of the tech can we improve?
    - `Vision: Product` - What more dimensions of product we can look at?

  - Difficulty (difficulty level according to experience)

    - `Difficulty: First timers` - Great for new contributors/beginners
    - `Difficulty: Easy` - The changes required have difficulty of easy
    - `Difficulty: Easy-Medium` - The changes required have difficulty between easy & medium
    - `Difficulty: Medium` - The changes required have difficulty of medium
    - `Difficulty: Medium-Hard` - The changes required have difficulty between medium & hard
    - `Difficulty: Hard` - The changes required have difficulty of hard

  - Size (how big the change will be)

    - `Size: Large` - The changes required would take a few weeks
    - `Size: Medium-Large` - The changes required would take between few days to few weeks
    - `Size: Medium` - The changes required would take a few days
    - `Size: Small-Medium` - The changes required would take between few hours to few days
    - `Size: Small` - The changes required would take a few hours

  - Priority (how urgent are the changes needed, self explanatory)

    - `Priority: High`
    - `Priority: Medium`
    - `Priority: Low`

  - Status (PM related tags, once we confirm the issue needs to be handled)

    - `Status: TODO` - The changes required have not yet started
    - `Status: In Progress` - The changes required are in progress
    - `Status: In Review` - The changes required are completed, and being reviewed by the team
    - `Status: Completed` - The changes required have been completed
    - `Status: Blocked` - Cannot progress further as dependant on some other changes

  - Domain (Type of change required for the issue from perspective of the member)
    - `Domain: Documentation` -Documentation related changes
    - `Domain: Dependency` - The changes required would add/remove a dependency
    - `Domain: Security` - The changes required would affect security
    - `Domain: Build` & CI - The changes required are related to the build/CI pipelines
    - `Domain: Refactoring` - The changes required neither adds a new feature or fixes a bug
    - `Domain: Performance` - The changes required would improve upon existing performance
    - `Domain: Feature` - The changes required would add a new feature
    - `Domain: Breaking` - The changes required would lead to a backward incompatible change
    - `Domain: Critical` - The changes required are very important
    - `Domain: Minor` - The changes required are not very important

### Stage 4

- Once an issue has been assigned to you, you can start with the required changes and create a Pull Request for the same.
- Once the Pull Request is merged, the issue will be marked as `Status: Completed`, and the issue will be closed!
