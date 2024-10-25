# Multi Number Caller

This app calls multiple numbers at the same time. Only the first user to answer is served. The other calls are cancelled or hanged.

# Deployment Guide

## Prerequisites ##
    - A Vonage application with a properly configured Voice Webhook and LVN (Vonage Number)
      - Read more about [Getting Started with the Vonage Voice API](https://developer.vonage.com/en/voice/voice-api/getting-started)
    - A publicly accessible Server to host your software so your webhooks are accessible by your Vonage app
    - Or you can use a tunneling software to host it (ngrok, localtunnel, etc)

## 1. Install dependencies:

    npm install

## 2. Populate “.env”
Copy `.env-sample` file as `.env` and put in the values for the following:
 
 

 - **API_KEY**
        - Your VONAGE API Key
 - **API_SECRET**
        - Your VONAGE SECRET Key        
  - **APPLICATION_ID**
        - Your VONAGE App ID
 - **PRIVATE_KEY**
        - your private key path 
- **PORT**
        - port where we run this service
 - **VONAGE_LVN**
        - Your VONAGE LVN to use for calling
 - **APIHOST**
        - The API host you want to use (more on this later)
 - **WSHOST**
        - The Websocket host you want to use. Must match API Host (more on this later)  

## 3. Add your private key
Open `private.key` and put your actual private key here

## 4. Running

    node index.js

## 5. How this works
When you open the service on your browser, you would see a simple text box. This text box accepts multiple numbers to call. The numbers must be in [E.164 format](https://developer.vonage.com/en/voice/voice-api/concepts/numbers) separated by a comma (,).

**Example**: `6598765432,6590987890,6590090009`

Pressing the `Call` button will initiate the call. All the numbers will be rung. The first user who answers will get connected to the app. The others will be cancelled or hanged.

When the App hangs the call, the call is ended.
When the User hangs the call, the call is ended.

## 6. Notes
The **APIHOST** ans **WSHOST** is used to set both the server and the client to the same datacenter. They have to be set to the same

The datacenter URLs and an explanation of configuring datacenters are available here: https://developer.vonage.com/en/vonage-client-sdk/configure-data-center?source=vonage-client-sdk


