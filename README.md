# EV3Web Server

This is the server for the EV3Web remote control interface. You'll need to have a Lego Mindstorms EV3 running leJOS EV3 with the EV3Web client installed. Make sure that the server address is correct before compiling the client.

The EV3Web client contains an administrator interface and a main user interface. The admin page is available at `/admin`, and by default the password is "robot2016." Make sure to set your own password and (if you would like) change the server port before running.

**The security on this server is *abysmal*. Seriously, don't use this in a production environment without re-writing a large portion of the code. Use with caution.**
