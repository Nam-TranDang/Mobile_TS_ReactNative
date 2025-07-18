// Sample notification data for testing
// This can be used to test the UI locally before integrating with the backend

const mockNotifications = [  {
    _id: '1',
    type: 'follow',
    message: 'dexvy_tran followed you. You have 2 mutuals.',
    read: false,
    sourceUser: {
      _id: '123',
      username: 'dexvy_tran',
      profilePicture: null // Will use default avatar
    },
    sourceUserId: '123',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    isFollowingBack: false // Show the Follow button
  },
  {
    _id: '6',
    type: 'follow',
    message: 'reader_jane started following you.',
    read: true,
    sourceUser: {
      _id: '456',
      username: 'reader_jane',
      profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg'
    },    sourceUserId: '456',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    isFollowingBack: true // Already following back, no Follow button
  },
  {
    _id: '2',
    type: 'like',
    message: 'Jane Doe liked your book "The Great Adventure"',
    read: true,
    bookId: '456',
    sourceUser: {
      _id: '789',
      username: 'jane_doe',
      profilePicture: 'https://randomuser.me/api/portraits/women/65.jpg'
    },
    sourceUserId: '789',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    _id: '3',
    type: 'comment',
    message: 'John Smith commented on your book "The Mystery of the Old House"',
    read: false,
    bookId: '457',
    sourceUser: {
      _id: '790',
      username: 'john_smith',
      profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    sourceUserId: '790',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    _id: '4',
    type: 'new_post',
    message: 'Writer Mike, who you follow, published a new book "The Secret Garden"',
    read: false,
    bookId: '458',
    sourceUser: {
      _id: '791',
      username: 'writer_mike',
      profilePicture: 'https://randomuser.me/api/portraits/men/45.jpg'
    },
    sourceUserId: '791',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    _id: '5',
    type: 'report',
    message: 'Your report about the book "Inappropriate Content" has been reviewed',
    read: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
  }
];

export default mockNotifications;
