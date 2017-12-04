# How to create Swagger based documentation on a Static HTML file

All you need to generate the static HMTL is the JSON file created by Swagger

## 1. Spectacles

Simply install Spectacle from `npm`  typing:

``` 
npm install -g spectacle-docs
```

Next you need to pass the JSON file to generate the HTML typing:

```
spectacle -d doc.json
```

The documentation will be located in the public directory by default.

More info about this package [here](https://github.com/sourcey/spectacle).


## 2. Bootprint

Install the package usin `npm`typing:

```
npm install -g bootprint
npm install -g bootprint-openapi
```

Now you can use the command 

```
bootprint openapi https://platform.appcivist.org/api/doc.json target
```

To create a single file we can use the `npm` package `html-inline` describing the usage next.



More info about this package [here](https://www.npmjs.com/package/bootprint-swagger).

## 3. HTML-Inline

Install the package:

```
npm -g install html-inline
html-inline target/index.htm  >> self_contained_file.html
```


