# Holcim Call Sage

**AI-Powered Quality Assistant for Holcim**

## Overview

Holcim Call Sage is an internal tool designed to assist in the quality management process for call center interactions. It leverages Generative AI to provide a non-biased review of call transcripts or recordings based on a customizable scoring matrix. The application analyzes the conversation, scores the analyst against predefined criteria, extracts key information, and provides actionable feedback for improvement.

## Core Features

-   **AI-Powered Review Generation**: Automatically generates a structured and objective review of a call, including scores, justifications, and an overall summary.
-   **Customizable Scoring Matrix**: Allows quality managers to define their own evaluation criteria through a user-friendly interface. A default matrix is provided as a starting point, which can be easily modified, extended, or shortened to fit specific needs.
-   **Transcript & Audio Input**: Users can either paste a call transcript directly (e.g., from Genesys Cloud) or upload a `.wav` audio recording for the AI to transcribe and analyze.
-   **Analyst Identification**: The AI is instructed to intelligently extract the analyst's name from call metadata, ensuring accurate reporting even if the name is not clearly captured in the dialogue.
-   **Structured Feedback**: The output includes a clear breakdown of scores for each criterion, a concise summary, and actionable areas for improvement, making it easy to digest and act upon.

## How to Use the Application

1.  **Define the Call Scoring Matrix**:
    -   On the left side of the screen, you will find the scoring criteria in an accordion-style list.
    -   You can click on any criterion to expand it and edit its name and description.
    -   Click the **"Add Criterion"** button to add a new item to the list.
    -   Click the trash can icon next to a criterion to delete it (a confirmation will be required).

2.  **Provide the Call Data**:
    -   On the right side of the screen, you have two options for input:
        -   **Option A: Paste Transcript**: Copy the call transcript from its source (e.g., Genesys Cloud) and paste it into the "Input Call Transcript" text area.
        -   **Option B: Upload Audio**: Click the "Select .wav file" button to upload a call recording. The AI will handle the transcription automatically.
    -   *Note: If a `.wav` file is uploaded, it will take priority, and any text in the transcript box will be disregarded.*

3.  **Generate the Review**:
    -   Click the **"Generate Call Review"** button at the bottom.
    -   The button will become active once either a transcript or a `.wav` file has been provided. A loading indicator will show that the analysis is in progress.

4.  **View the Results**:
    -   Once the AI has completed its analysis, the generated review will appear at the bottom of the page, formatted for clarity and easy reading.

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
