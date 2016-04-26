# sc-web
Security Council web interface

## Deployment instructions

```
[$ cd sc-web]
$ python -m SimpleHTTPServer
```
or
```
$ python3 -m http.server
```
Then browse to [localhost:8000](http://localhost:8000)  
For the patient/parent view, that's [localhost:8000/?role=patient](http://localhost:8000/?role=patient) or [localhost:8000/?role=parent](http://localhost:8000/?role=parent)  
the default server is the SMART open API server  
For the MiHIN server it's [localhost:8000/?server=MiHIN](http://localhost:8000/?server=MiHIN)

### Development tutorials, useful resource URLs, etc
[docs.smarthealthit.org/tutorials/javascript/](http://docs.smarthealthit.org/tutorials/javascript/)  
[docs.smarthealthit.org/clients/javascript/](http://docs.smarthealthit.org/clients/javascript/)  
[docs.smarthealthit.org/tutorials/server-quick-start/](http://docs.smarthealthit.org/tutorials/server-quick-start/)

