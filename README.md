# see-with-eyes-closed
The code for the [See With Eyes Closed website and blog](https://seewitheyesclosed.com).

## Installation
First, make sure you have MongoDB installed:

```
https://docs.mongodb.com/manual/administration/install-community/
```

Next, open a command prompt in the same directory as this README and run `npm install`. This will install dependencies.

Next, create a copy of `config.example.json` and name it `config.json`. This is where all the main site settings go. Here's a list of items you might want to change (You can leave it as is and it'll work except for the reCAPTCHA boxes):

- `port` - The localhost port the app will be served to.
- `mongodbURI` - The connection URI for MongoDB. If you installed normally as in the guide above, leave this as is.
- `reCAPTCHApublic` and `reCAPTCHAprivate` - Public and private reCAPTCHA keys. You don't _need_ these unless you want to be able to add comments to articles.
- `email` - The email the contact form sends to
- `admins` - Okay, you'll want to change this if you're in any kind of production server. Admins are added in key value pairs where the key is the username and the value is the password. The admin dashboard is located at `/admin/`.
- `defaultAuthor` - Set this to your own name. Whenever you post an article or something you wrote, the author name will default to this value.
- `sessionSecret` - Just put some random string here. Doesn't matter too much what since we're not storing any sensitive info in the sessions. You can even leave it as is if you like.

There's no need to set up a MongoDB database as they're automatically created when first used.

## Running the Server

Before doing anything, make sure your MongoDB server is running. If you installed it as a service, you shouldn't need to worry about this. See the instructions depending on your installation.

There are two ways to run the server. In production:

```
npm start
```

This will start a pm2 server that will serve the site to the specified port until further notice **even if you close the command line window**. To restart the server (for example, when you need to update the code) run `npm run restart` and to stop it run `npm stop`. You can view logs with `npm run logs`.

Now, most of the time you'll be in development, so this command will suffice:

```
npm run dev
```

This will start a nodemon script which will automatically reload the server whenever there are changes to the code. It will stop when you close the command line window.

One last thing: before contributing changes, always run `npm run lint`. This will alert you to any semantic problems in your code. The one issue you can ignore: `no-unused-vars` or `no-undef` when referring to a function that exists, but is used in a different file. In that case it's wrong. Anything else, fix or ask about.

Enjoy! This has been tested and verified to work properly on Windows 10, CentOS 8, and Ubuntu 20.
