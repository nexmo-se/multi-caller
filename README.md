# Multi Number Caller

This app calls multiple numbers at the same time. Only the first user to answer is served. The other calls are cancelled or hanged.

# Deployment Guide

## 1. Install dependencies:

    npm install

## 2. Populate “.env”
Copy `.env-samp` file as `.env` and put in the values for the following:
 
 

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
The **APIHOST ** is used to set both the server and the client to the same datacenter. If the set to default, they might spawn conference members on different datacenters and the connection will not happen.

The following are the available options
-   `api-us-3.vonage.com`: Virginia
-   `api-us-4.vonage.com`: Oregon
-   `api-eu-3.vonage.com`: Dublin
-   `api-eu-4.vonage.com`: Frankfurt
 -   `api-ap-3.vonage.com`: Singapore
-   `api-ap-4.vonage.com`: Sydney


