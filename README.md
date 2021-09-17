# Chit Chat (Server-Side)

This is the server-side for the messaging app, tentatively called Chit Chat messaging. I created it using Node and Express, and connected it to a MongoDB database. The server-side is built using REST API architecture.

## Features

The current implementation supports the API requests that listed in the table below.

|Request|Method Type|Expected response|
|-------|-----------|-----------------|
|`user/`|`POST`| Returns a list of all the users that contains the search input |
|`user/contact/new`|`POST`| Adds each other's contacts in the respective friend list |
|`user/contact/all`|`POST`| Returns a list of all the users in a user's contact |
|`user/chat/new`|`POST`| Creates a new chat between a user and one of their friends |
|`user/message/all`|`POST`| Creates a new message between a user and one of their friends |
|`user/register`|`POST`| Creates a new user |
|`user/login`|`POST`| Authenticate user |

## How to install

First, you need to download the repository. After downloading, navigate to the root folder. **Please Note**: I used the YARN package manager, you don't have it you can following the steps found by clicking [here]('https://yarnpkg.com/getting-started/install'). Then just run the command below to install all the dependencies.

```
yarn install
```

## How to run

⚠ **Important Notice**: The server must be connect to a mongo database meaning you will need to create a `.env` file, copy the information found in the `.env.sample` file and then add the relevant information. Afterwards, you can run the following command to start the server.

```
yarn run dev
```
