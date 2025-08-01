# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2024-08-02

### Added
- **"Call Sage" Chatbot (Beta)**: After a review is generated, a new chatbot is available to discuss the review in detail, providing follow-up analysis and answering questions about the scoring.
- **Chatbot Transcript Download**: A "Download Transcript" button has been added to the chatbot interface, allowing users to save the full conversation with the AI as a `.txt` file for their records.

### Changed
- **UI Consistency**: The hover style for the new "Download Transcript" button in the chatbot now aligns with the application's primary color theme.

### Fixed
- **React Hook Error**: Resolved a `useEffect` dependency array error in the settings dialog that was causing issues between component renders.
- **Development Server Script**: Removed a redundant port argument from the `dev` script in `package.json` to prevent potential startup conflicts.

## [1.3.1] - 2024-08-02

### Changed
- **AI Timestamp Accuracy**: The AI is now provided with the total conversation duration and is explicitly instructed not to hallucinate timestamps that fall outside of the actual call length.
- **Gender-Neutral Language**: Updated the AI prompt to ensure it uses gender-neutral pronouns (they/them) when referring to the agent, avoiding any assumptions about gender.
- **UI/UX Refinements**:
    - The labels for "Agent Name," "Overall Score," "Conversation ID," and "Conversation Duration" in the generated review now have a consistent, bold style for better visual hierarchy.
    - Text colors for justifications and summaries have been unified for improved readability.
    - Key data points like the Agent's Name and Conversation ID now use the primary theme color to stand out.
- **Workflow Improvement**: On the main form, the "Conversation ID" input field now appears before the "Agent Name" fields for a more logical workflow.

### Fixed
- **PDF Export Rendering**: Refactored the PDF generation logic to render each major section of the report individually. This prevents page breaks from occurring in the middle of a content block, resulting in a cleaner and more professional multi-page document.

## [1.3.0] - 2024-08-02

### Added
- **Conversation Duration Display**: The quick summary card in the generated review now displays the "Conversation Duration", automatically calculated from the audio file length or estimated from transcript timestamps.
- **Automatic Conversation ID Extraction**: When a `.wav` file is uploaded, the system now automatically extracts a UUID from the filename and populates the "Conversation ID" field, streamlining the input process.

### Changed
- **Terminology**: Renamed "Interaction ID" to "Conversation ID" throughout the application for consistency.
- **AI Personalization**: Updated the AI prompt to refer to the agent by their first name in all generated review text, creating a more personal and friendly tone.
- **UI Workflow**: The main form has been rearranged for a more logical workflow:
    1. Upload Call Recording / Input Transcript
    2. Agent Name
    3. Conversation ID
- **Collapsible Transcript Input**: The text area for pasting a transcript is now hidden by default within a collapsible section to create a cleaner and tidier interface.
- **UI Layout**:
    - The "Conversation ID" and "Conversation Duration" now appear on the same line in the summary card for a more compact layout.
    - Added a horizontal separator on the main form for better visual distinction between input sections.

## [1.2.2] - 2024-08-02

### Changed
- **UI/UX**: Improved the criterion details popup. The content is now scrollable to gracefully handle long descriptions, and the title and scrollbar have been styled to match the application's theme.

## [1.2.1] - 2024-08-02

### Changed
- **UI/UX**: Refined the score display in the generated review.
- The "Overall Score" circle has been made smaller for a more balanced layout.
- Individual criteria scores are now displayed in smaller, rounded rectangles (e.g., "X/5") for a cleaner look.
- The "Overall Score" label is now on a single line to improve alignment.

## [1.2.0] - 2024-08-01

### Changed
- **Rigid Scoring Matrix**: The core scoring matrix is now rigid and cannot be edited or deleted by users from the settings panel. This ensures a consistent baseline for all standard evaluations.
- **Ad-Hoc Custom Criteria**: Users can now add their own custom criteria on an ad-hoc basis via the Settings panel. These custom criteria are temporary and will reset upon reloading the application, providing flexibility for specific, one-off evaluations without altering the core matrix.
- **State Management**: The application's state management (`zustand`) has been refactored to separate the rigid matrix from temporary custom criteria.

## [1.1.0] - 2024-08-01

### Added
- **Integrated Audio Player**: When a `.wav` file is uploaded, an audio player now appears above the generated review, allowing for direct playback of the call recording.
- **Clickable Timestamps**: Justifications, good points, and areas for improvement now feature clickable timestamp badges. Clicking a timestamp jumps the audio player to the corresponding moment in the call, streamlining the human verification process.
- **"Good Points" Section**: The review now includes a "Good Points" section to provide a balanced and fair assessment, highlighting agent strengths alongside areas for improvement.
- **Human Override for Text**: Users can now click a pencil icon to edit the AI-generated "Overall Summary" and justification texts for each scoring criterion, providing full control over the final report.
- **Required Agent Name**: The agent's name is now a mandatory field, split into "First Name" and "Surname" for better data consistency.
- **Changelog**: This `CHANGELOG.md` file was created to track version history.
- **Print-Specific Styling**: The PDF export is now cleaner and more professional. Interactive elements like the audio player and clickable timestamp badges are automatically excluded from the printout, while plain-text timestamps are retained for reference.

### Changed
- **AI Instructions**: The AI prompt has been significantly updated to extract timestamps, identify "Good Points," and use the agent's first name to locate their introduction in the transcript.
- **UI/UX**:
    - Icon button styles (Info, Settings, Edit) now have a consistent hover effect that matches the application's primary color scheme.
    - The "Quick Score" has been renamed to "Overall Score" throughout the application for clarity.
    - The score editing input now correctly enforces whole numbers, preventing decimals.

### Fixed
- **HTML Structure**: Resolved a hydration error by changing the `Badge` component from a `<div>` to a `<span>`, ensuring valid HTML nesting.


## [1.0.0] - 2024-07-31

### Added
- **Initial Release**: First version of the Holcim Call Sage application.
- **AI-Powered Review Generation**: Core feature to generate a non-biased review of a call transcript based on a customizable scoring matrix.
- **Customizable Scoring Matrix**: Interface to add, edit, and delete scoring criteria.
- **Transcript Input**: Text area for pasting call transcripts from sources like Genesys Cloud.
- **Review Display**: Structured view for displaying the AI-generated review, including scores, summaries, and areas for improvement.
- **Loading and Error Handling**: Basic states for loading and error messages during review generation.
- **Score Editing**: Ability for a human to override the AI-generated integer score for each criterion.
- **PDF Export**: Functionality to print the final verified review to a PDF document.
