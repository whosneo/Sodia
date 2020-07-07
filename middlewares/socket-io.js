const Story = require('../models/story');

/**
 * Initialize the socket.io here.
 */
exports.init = (io, app) => {
    io.on('connection', socket => {
        console.log('a user connected by socket.io', socket.conn.remoteAddress);
        socket.on('new', async id => { // when some one send the story id on 'new' channel
            const story = await Story.findOne({_id: id}) // we need to get the story by id
                .populate({path: 'user', select: 'local.user_id local.name'}).exec();
            if (story)
                socket.broadcast.emit('new', story); // and broadcast this story to every one who is on 'new' channel
        }); // and this is how showing newest story work
        socket.on('disconnect', () => console.log('user disconnected', socket.conn.remoteAddress));
    });
};