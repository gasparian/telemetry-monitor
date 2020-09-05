#pragma once

#include <chrono>
#include <thread>
#include <string>
#include <thread>
#include <fstream>
#include <iostream>
#include <pthread.h>

#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/ip/tcp.hpp>

using tcp = boost::asio::ip::tcp;               // from <boost/asio/ip/tcp.hpp>
namespace websocket = boost::beast::websocket;  // from <boost/beast/websocket.hpp>

//------------------------------------------------------------------------------

struct File {
    std::ifstream input;

    File() : input("") {};
    File(std::string path) {
        // keep the first row with the columns names
        input.open(path);
        if (!input.is_open()) {
            std::exit(EXIT_FAILURE);
        }
    }
    ~File() {
        input.close();
    }
};

void do_session(tcp::socket& socket, std::string& path, int sleep) {
    try {
        // read a `demo` file
        File file(path);

        // Construct the stream by moving in the socket
        websocket::stream<tcp::socket> ws{std::move(socket)};

        // Accept the websocket handshake
        ws.accept();
        std::string command, output;

        for(;;) {
            // This buffer will hold the incoming message
            boost::beast::multi_buffer buffer;

            // Read a message
            ws.read(buffer);
            ws.text(ws.got_text());
            command = boost::beast::buffers_to_string(buffer.data());

            // check the command
            if ( command == "start stream" ) {
                // block until the whole file will be transmitted
                while ( std::getline(file.input, output, '\n') ) {
                    ws.write(boost::asio::buffer(output));
                    std::this_thread::sleep_for(std::chrono::milliseconds(sleep));
                };
            } else {
                // Echo the message back
                ws.write(buffer.data());
            }
        }
    }
    catch(boost::system::system_error const& se) {
        // This indicates that the session was closed
        if(se.code() != websocket::error::closed)
            std::cerr << "Error: " << se.code().message() << std::endl;
    }
    catch(std::exception const& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }
}
