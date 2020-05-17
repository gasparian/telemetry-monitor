cmake_minimum_required(VERSION 2.8 FATAL_ERROR)
project(embeddedServerDemo)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -pthread -Wall")
find_package(Boost 1.66 REQUIRED COMPONENTS system)
include_directories(${Boost_INCLUDE_DIRS})

add_executable(websocket-server-sync src/websocket_server.cpp)
target_link_libraries(websocket-server-sync ${Boost_LIBRARIES})
