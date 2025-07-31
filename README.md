# Holcim Call Sage (v1.1)

**AI-Powered Quality Assistant for Holcim**

## Overview

Holcim Call Sage is an internal tool designed to assist in the quality management process for call center interactions. It leverages Generative AI to provide a non-biased review of call transcripts or recordings based on a customizable scoring matrix. The application analyzes the conversation, scores the analyst against predefined criteria, extracts key information, and provides actionable feedback for improvement.

## Core Features

-   **AI-Powered Review Generation**: Automatically generates a structured and objective review of a call, including scores, justifications, and an overall summary.
-   **Customizable Scoring Matrix**: Allows quality managers to define their own evaluation criteria through a user-friendly interface. A default matrix is provided as a starting point, which can be easily modified, extended, or shortened to fit specific needs.
-   **Transcript & Audio Input**: Users can either paste a call transcript directly (e.g., from Genesys Cloud) or upload a `.wav` audio recording for the AI to transcribe and analyze.
-   **Integrated Audio Player**: When a `.wav` file is used, an audio player appears, allowing for direct playback of the call recording within the app.
-   **Clickable Timestamps**: The generated review includes timestamps for justifications, good points, and areas for improvement. Clicking on a timestamp in the web view jumps the audio player to that exact moment in the call, making verification seamless.
-   **Analyst Identification**: The AI is instructed to intelligently extract the analyst's name from call metadata, ensuring accurate reporting even if the name is not clearly captured in the dialogue.
-   **Structured Feedback**: The output includes a clear breakdown of scores for each criterion, a list of "Good Points," a concise summary, and actionable "Areas for Improvement," making it easy to digest and act upon.
-   **PDF Export**: The final, human-verified review can be exported as a professional PDF document, including the checker's name and the date of review. The exported report is clean and does not include interactive elements like the audio player.

## How to Use the Application

1.  **Review the Call Scoring Matrix (Optional: Edit if needed)**:
    -   The application comes with a pre-defined scoring matrix, which is displayed on the left side of the main screen. You can click the **Info** icon next to each criterion to see its full description.
    -   To edit the matrix, click the **Settings** (gear) icon in the top-right corner. This is an optional step if the default criteria meet your needs.
    -   In the settings panel, you can click on any criterion to expand it and edit its name and description. You can also add new criteria or delete existing ones. Click "Save Changes" to apply your modifications.

2.  **Provide the Call Data**:
    -   On the right side of the screen, fill in the required details:
    -   **Agent Name**: Enter the agent's first name and surname. This is a mandatory field.
    -   **Interaction ID**: Enter the unique identifier for the call (e.g., from Genesys Cloud). This is a mandatory field.
    -   **Input Call Transcript OR Upload Audio**:
        -   **Option A: Paste Transcript**: Copy the call transcript from its source and paste it into the "Input Call Transcript" text area.
        -   **Option B: Upload Audio**: Click the "Select .wav file" button to upload a call recording. The AI will handle the transcription automatically.
    -   *Note: If a `.wav` file is uploaded, it will take priority, and any text in the transcript box will be disregarded.*

3.  **Generate the Review**:
    -   Click the **"Generate Call Review"** button at the bottom.
    -   The button will become active once an Interaction ID, agent name, and either a transcript or a `.wav` file have been provided. A loading indicator will show that the analysis is in progress.

4.  **Verify and Print the Review**:
    -   Once the AI has completed its analysis, the generated review will appear at the bottom of the page.
    -   If you uploaded a `.wav` file, an **audio player** will appear above the report.
    -   Review the generated scores, summaries, and feedback.
    -   Click the **timestamp badges** (e.g., `[00:01:23]`) next to a comment to jump the audio player to that specific point in the call.
    -   You can click the **pencil icon** next to any score or text block to amend it if necessary.
    -   In the "Checked By" section at the bottom of the review, enter your name.
    -   Click the **"Print to PDF"** button to save a final, verified copy of the report.

## Technical Stack

-   **Framework**: [Next.js](https://nextjs.org/) with React
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
-   **Generative AI**: [Firebase Genkit](https://firebase.google.com/docs/genkit) using Google's AI models.

## Getting Started (Local Development)

To run this project on your local machine, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone <your-repository-url>
    cd <your-project-directory>
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**:
    -   This project requires an API key from a supported AI provider (e.g., Google AI Studio) to function.
    -   Create a file named `.env` in the root of your project.
    -   Add your API key to this file:
        ```
        GEMINI_API_KEY=your_api_key_here
        ```

4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

The application will now be running at [http://localhost:9002](http://localhost:9002).
