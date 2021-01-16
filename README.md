https://gasparian.github.io/telemetry-monitor/public/  

## Telemetry monitor  

<p align="center"> <img src="https://github.com/gasparian/telemetry-monitor/blob/master/public/img/demo-pic.png" height=500 /> </p>  

If you're using [KITTI raw](http://www.cvlibs.net/datasets/kitti/raw_data.php) dataset, first [accumulate](https://gist.github.com/gasparian/7cd1b82e78a2ebefe895242616e87411) all GNSS/IMU readings.  
In order to work with custom-formatted data, change implementation of `parseData()` methods in `./client/js/data_processors.js`.  

### Controls  
 - `Choose file` - is for file uploading  
 - `play/stop` buttons are for animation of the finished ride (when the socket is closed)  
 - `Socket` button opens and closes web-socket connetction with the embedded server (see server address input in the middle)  
 - `Download` - is for downloading parsed data to the local machine  
 - `Upload` - to upload a `*.yaml` config file to the server  
 - use slider to choose a batch size for visualization  

### To do:  
 - First order:  
     - make data parser for custom data --> look at the processing from `ins` repo  
 - Second order:  
     - fix small delay at start of data transfer through web-socket  
     - fix classes and ids mess in layout and styles  
     - work with graphs' zooming/panning - smth wrong on large files  
     - add configurable plots (smth like plus sign...) == components?  
     - charts.js --> D3.js (?)  

### Running client locally  
Install dependencies:  
```
npm run install
```  
Make a client bundle via webpack and run the server:  
```
npm run wp_dev  
npm run up_server  
```  
Or use docker, if you need to:  
```
docker-compose build
docker-compose up
```  

### Embedded-server "emulator"  

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
Messages processing logic is implemented in `./embedded_server_proto/src/session_processor.hpp`-->`do_session`.  

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
