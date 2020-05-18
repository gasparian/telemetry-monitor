<img src="https://travis-ci.com/gasparian/telemetry_monitor.svg?branch=master"/>  
https://gasparian.github.io/telemetry_monitor/client/  

## Telemetry monitor  

<p align="center"> <img src="https://github.com/gasparian/telemetry_monitor/blob/master/client/img/demo-pic.png" height=500 /> </p>  

If you're using [KITTI raw](http://www.cvlibs.net/datasets/kitti/raw_data.php) dataset, first [accumulate](https://gist.github.com/gasparian/7cd1b82e78a2ebefe895242616e87411) all GNSS/IMU readings.  

### To do:  
 - build server on C++ (use web-sockets --> boost.beast):  
     - add file processor for emulating device messages;  
     - add commands processor on server;  
     - add commands reference in a readme;  
 - charts.js --> D3.js (?);  
 - work with graphs' zooming/panning;  

### Libs  
 - ArcGIS;  
 - charts.js;
 - hammerjs;  

 Install:  
 - node;  
 - express: `npm init --yes` --> `npm i express`;  

 For local tests:  
 - nodemon: `npm i -g nodemon`;  

### Running client  

Server with auto-reloading:  
```
nodemon app.js
```  

### Running embedded-server "emulator"  

Remove previous boost version:  
```
sudo apt-get update
# to uninstall deb version
sudo apt-get -y --purge remove libboost-all-dev libboost-doc libboost-dev
# to uninstall the version which we installed from source
sudo rm -f /usr/lib/libboost_*
sudo rm -rf /usr/include/boost
sudo rm -rf /usr/lib/cmake/boost_*
sudo rm -rf /usr/lib/cmake/Boost_*
```  

Install boost 1.66 (first version contains beast library):  
```
wget -O /tmp/boost_1_66_0.tar.gz https://sourceforge.net/projects/boost/files/boost/1.66.0/boost_1_66_0.tar.gz
cd /usr/local
sudo tar -xf /tmp/boost_1_66_0.tar.gz
cd ./boost_1_66_0
sudo ./bootstrap.sh --prefix=/usr --show-libraries
sudo ./bjam --prefix=/usr install 
```  
Compile the project:  
```
cd ./embedded_server_proto
mkdir build && cd build
cmake .. && make
```  
Run the server:  
```
./websocket-server-sync 0.0.0.0 8008
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
