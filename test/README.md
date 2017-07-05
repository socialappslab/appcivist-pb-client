In the html file you can find first the scripts for import the Jasmine dependencies to that file in particular, more information on http://www.bradoncode.com/blog/2015/05/12/angularjs-testing-getting-started/
This way is the easiest because you don't have to install anything in the pb-client main project.

Then we import the angular.min and angular-mocks modules because this are essentials to test the angular app.

The next step is to import from the local directory the files .js that we are going to use, in this case the app.js and dashboard.js

We leave the <body> block empty because the Jasmine Framework will add the visual information that we need.

After the <body> we open another <script> block but in here we are going to write the code for the testin.

In the first line of the test script we will find 'var myReporter ...' this is a generic reporter that I found on internet that
helps to see the process on the browser console. You can disable it by commenting the 'jasmine.getEnv().addReporter(myReporter)'

In Jasmine we have basically 4 or 5 essentials functions, these are

	describe
	beforeEach
	afterEach
	it


The it block is the actual code that will be executed to test anything we want, this block have an string parameter to put what will test that particually block (e.g. x variable should be defined, y must be 5)

The beforeEach is a function that will execute before every it block (e.g. module injections, etc)

The afterEach is a function that will execute after every it block (e.g. cleanup code)

We use the describe block to name the Test Suite (this text will appear on the UI of the html file) or to Be more specific on
a group of it blocks.

The problem that I have and couldn't solve was that when I try to inject the appCivistApp module into my script these step fails,
I don't know why because I wrote another simple project and worked just fine this way. The following code I could not test because this inyection problem
but should work just fine once we can inject the appCivistApp module. 

This is a very basic documentation on how to test a controller with jasmine but it has everything that we need to make this simple test work

http://www.bradoncode.com/blog/2015/05/17/angularjs-testing-controller/
