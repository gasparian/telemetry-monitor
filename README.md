## Telemetry monitor [IN PROGRESS]  

<p align="center"> <img src="https://github.com/gasparian/telemetry_monitor/blob/master/client/img/Screenshot from 2020-04-28 20-56-47.png" height=500 /> </p>  

If you're using [KITTI raw](http://www.cvlibs.net/datasets/kitti/raw_data.php) dataset, first [accumulate](https://gist.github.com/gasparian/7cd1b82e78a2ebefe895242616e87411) all GNSS/IMU readings.  

### To do:  
 - charts.js --> D3.js;  
 - pack into Docker --> build on DockerHub;  
 - add tabs in a right field: chart and control panel;  
 - add COM-port settings form, near the upload section;  

### Libs  
 - ArcGIS;  
 - charts.js;
 - hammerjs;  
 - node;  
 - nodemon: `npm i -g nodemon`;  
 - express: `npm init --yes` --> `npm i express`;  

### Running  

Server with auto-reloading:  
```
nodemon app.js
```  

### Kitti data format specs  
```
  - lat:     latitude of the oxts-unit (deg)
  - lon:     longitude of the oxts-unit (deg)
  - alt:     altitude of the oxts-unit (m)
  - roll:    roll angle (rad),  0 = level, positive = left side up (-pi..pi)
  - pitch:   pitch angle (rad), 0 = level, positive = front down (-pi/2..pi/2)
  - yaw:     heading (rad),     0 = east,  positive = counter clockwise (-pi..pi)
  - vn:      velocity towards north (m/s)
  - ve:      velocity towards east (m/s)
  - vf:      forward velocity, i.e. parallel to earth-surface (m/s)
  - vl:      leftward velocity, i.e. parallel to earth-surface (m/s)
  - vu:      upward velocity, i.e. perpendicular to earth-surface (m/s)
  - ax:      acceleration in x, i.e. in direction of vehicle front (m/s^2)
  - ay:      acceleration in y, i.e. in direction of vehicle left (m/s^2)
  - az:      acceleration in z, i.e. in direction of vehicle top (m/s^2)
  - af:      forward acceleration (m/s^2)
  - al:      leftward acceleration (m/s^2)
  - au:      upward acceleration (m/s^2)
  - wx:      angular rate around x (rad/s)
  - wy:      angular rate around y (rad/s)
  - wz:      angular rate around z (rad/s)
  - wf:      angular rate around forward axis (rad/s)
  - wl:      angular rate around leftward axis (rad/s)
  - wu:      angular rate around upward axis (rad/s)
  - posacc:  velocity accuracy (north/east in m)
  - velacc:  velocity accuracy (north/east in m/s)
  - navstat: navigation status
  - numsats: number of satellites tracked by primary GPS receiver
  - posmode: position mode of primary GPS receiver
  - velmode: velocity mode of primary GPS receiver
  - orimode: orientation mode of primary GPS receiver
```  
