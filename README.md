# appcivist-pb-client
Web Client of AppCivist, for the instance of Participatory Budgeting

## Installation

Before running the App, you will need to do the following: 

1. Install [Nodejs](https://nodejs.org/) and [NPM (Node Package Manager)](https://www.npmjs.org/)

	```ssh
	$ apt-get install curl
	$ curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -
	$ apt-get install nodejs
	$ apt-get install npm
	```

2. Using NPM, install [Bower package manager](http://bower.io)

	```ssh
	$ npm install -g bower
	```

3. Install [Grunt]()

	```ssh
	$ npm install -g grunt-cli
	```

4. Install the CSS authoring framework [Compass](http://compass-style.org) (you will need [Ruby first](http://www.ruby-lang.org/en/downloads/))

	```ssh
	$ apt-get install ruby ruby-dev
	$ gem update --system
	$ gem install compass
	```

5. Install the [Sass language](http://sass-lang.com)
	
	```ssh
	$ gem install sass
  ```

6. Update the API URLs in app.js to use your local/test/production APIs

## Run
1. Get the code

	```ssh
	$ git clone https://github.com/socialappslab/appcivist-pb-client.git
	```

2. You need to download the dependencies before run the application so,

	```ssh
	$ npm install
	```

3. Now you can run the app typing,

	```ssh
	$ grunt server
	```

4. Alternatively, you can use the packaged HTML/JS/CSS version and configure your HTTP server to have index.html as index in that directory

```
grunt build
cp -rf dist/* /path/to/html/version/appcivist-pb
```

4. Try visiting the following routes: 
	1. Go to [localhost:8000](http://localhost:8000)
	2. Login with these credentials: bob@example.com / secret => [/home](http://localhost:8000/home)
	3. Click on "+ Assembly" => [/assembly/create](http://localhost:8000/#/assembly/create)
	4. Click "Start Assembly" => [/assembly/1/forum](http://localhost:8000/#/assembly/1/forum)
	5. Click "Assemblies" => [/assemblies](http://localhost:8000/#/assemblies)
	6. Click "+Campaign" => [/assembly/1/campaign/create](http://localhost:8000/#/assembly/1/campaign/create)

5. For deployment, consider using this [sample](https://gist.github.com/cdparra/4e684b37ca60f370135b32f2bc39b611) to create an init.d script and then follow this [guide](https://www.digitalocean.com/community/tutorials/how-to-configure-a-linux-service-to-start-automatically-after-a-crash-or-reboot-part-1-practical-examples) to make sure the service is enabled. 


If you have problems maybe you can configure your git with this:
git config --global url."https://".insteadOf git://

[git]: http://git-scm.com/
[bower]: http://bower.io
[npm]: https://www.npmjs.org/
[node]: http://nodejs.org
[protractor]: https://github.com/angular/protractor
[jasmine]: http://jasmine.github.io
[karma]: http://karma-runner.github.io
[travis]: https://travis-ci.org/
[http-server]: https://github.com/nodeapps/http-server
