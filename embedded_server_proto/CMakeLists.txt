cmake_minimum_required(VERSION 2.8 FATAL_ERROR)

add_definitions(-std=c++11)

set(CXX_FLAGS "-Wall")

set(CMAKE_CXX_FLAGS, "${CXX_FLAGS}")

add_library(boost_beast INTERFACE)

target_include_directories(boost_beast 
                           SYSTEM
                           INTERFACE
                           "${CMAKE_CURRENT_LIST_DIR}/beast")

add_executable (websocket-server-sync src/websocket_server.cpp)
target_link_libraries (websocket-server-sync boost_beast)
