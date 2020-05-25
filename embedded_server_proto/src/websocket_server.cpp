//
// Copyright (c) 2016-2017 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/beast
//

//------------------------------------------------------------------------------
//
// Example: WebSocket server, synchronous
//
//------------------------------------------------------------------------------

#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <fstream>
#include <string>
#include <thread>
#include <pthread.h>

using tcp = boost::asio::ip::tcp;               // from <boost/asio/ip/tcp.hpp>
namespace websocket = boost::beast::websocket;  // from <boost/beast/websocket.hpp>

//------------------------------------------------------------------------------

class File {
public:
    std::ifstream input_;
    std::string str_;

    File(std::string path) {
        input_.open(path);
        if (!input_.is_open()) {
            std::exit(EXIT_FAILURE);
        }
        // keep the first row with the columns names
    };

    // void iter(websocket::stream<tcp::socket>& ws_) {
    //     while ( std::getline(input_, str_, '\n') ) {
    //         ws_.write(boost::asio::buffer(str_));
    //     };
    // };

    // void startStream(websocket::stream<tcp::socket>& ws_) {
    //     ThreadMap::const_iterator it = tm_.find("stream");
    //     if (it == tm_.end()) { // create new thread only if not found one
    //         std::thread thrd = std::thread(&File::iter, this, ws_);
    //         tm_["stream"] = thrd.native_handle();
    //         thrd.detach();
    //         std::cout << "Thread created!" << std::endl;
    //     }
    // };

    // void stopStream() {
    //     ThreadMap::const_iterator it = tm_.find("stream");
    //     if (it != tm_.end()) {
    //         pthread_cancel(it->second);
    //         tm_.erase("stream");
    //         std::cout << "Thread killed!" << std::endl;
    //     }
    // };

private:
    typedef std::unordered_map<std::string, pthread_t> ThreadMap;
    ThreadMap tm_;
};

// Echoes back all received WebSocket messages
void
do_session(tcp::socket& socket)
{
    try
    {
        // Construct the stream by moving in the socket
        websocket::stream<tcp::socket> ws{std::move(socket)};

        // read a `demo` file
        File file("../../data/sample.csv");

        // Accept the websocket handshake
        ws.accept();
        std::string command, output;

        for(;;)
        {
            // This buffer will hold the incoming message
            boost::beast::multi_buffer buffer;

            // Read a message
            ws.read(buffer);
            ws.text(ws.got_text());
            command = boost::beast::buffers_to_string(buffer.data());

            // check the command
            if ( command == "start stream" ) {
                while ( std::getline(file.input_, file.str_, '\n') ) { // quick hack
                    ws.write(boost::asio::buffer(file.str_));
                };
                // file.startStream(ws);
            } else if ( command == "stop stream" ) {
                // file.stopStream();
            } else {
                // Echo the message back
                ws.write(buffer.data());
            }
        }
    }
    catch(boost::system::system_error const& se)
    {
        // This indicates that the session was closed
        if(se.code() != websocket::error::closed)
            std::cerr << "Error: " << se.code().message() << std::endl;
    }
    catch(std::exception const& e)
    {
        std::cerr << "Error: " << e.what() << std::endl;
    }
}

//------------------------------------------------------------------------------

int main(int argc, char* argv[])
{
    try
    {
        // Check command line arguments.
        if (argc != 3)
        {
            std::cerr <<
                "Usage: websocket-server-sync <address> <port>\n" <<
                "Example:\n" <<
                "    websocket-server-sync 0.0.0.0 8080\n";
            return EXIT_FAILURE;
        }
        auto const address = boost::asio::ip::make_address(argv[1]);
        auto const port = static_cast<unsigned short>(std::atoi(argv[2]));

        // The io_context is required for all I/O
        boost::asio::io_context ioc{1};

        // The acceptor receives incoming connections
        tcp::acceptor acceptor{ioc, {address, port}};

        for(;;)
        {
            // This will receive the new connection
            tcp::socket socket{ioc};

            // Block until we get a connection
            acceptor.accept(socket);

            // Launch the session, transferring ownership of the socket
            std::thread{std::bind(
                &do_session,
                std::move(socket))}.detach();
        }
    }
    catch (const std::exception& e)
    {
        std::cerr << "Error: " << e.what() << std::endl;
        return EXIT_FAILURE;
    }
}