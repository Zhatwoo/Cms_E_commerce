// // models/User.js
// const bcrypt = require('bcryptjs');
// const { getFirestore } = require('../config/firebase');

// class User {
//   constructor(data) {
//     this.id = data.id || null;
//     this.name = data.name || '';
//     this.email = data.email || '';
//     this.password = data.password || '';
//     this.role = data.role || 'Client';
//     this.status = data.status || 'Published';
//     this.avatar = data.avatar || null;
//     this.phone = data.phone || null;
//     this.bio = data.bio || null;
//     this.lastLogin = data.lastLogin || null;
//     this.isActive = data.isActive !== undefined ? data.isActive : true;
//     this.createdAt = data.createdAt || new Date().toISOString();
//     this.updatedAt = data.updatedAt || new Date().toISOString();
//   }

//   // Hash password
//   static async hashPassword(password) {
//     const salt = await bcrypt.genSalt(10);
//     return await bcrypt.hash(password, salt);
//   }

//   // Compare password
//   static async comparePassword(enteredPassword, hashedPassword) {
//     return await bcrypt.compare(enteredPassword, hashedPassword);
//   }

//   // Get Firestore collection
//   static getCollection() {
//     const db = getFirestore();
//     return db.collection('users');
//   }

//   // Create new user
//   static async create(userData) {
//     const db = getFirestore();
//     const usersRef = db.collection('users');

//     // Hash password
//     const hashedPassword = await this.hashPassword(userData.password);

//     const newUser = {
//       name: userData.name,
//       email: userData.email.toLowerCase(),
//       password: hashedPassword,
//       role: userData.role || 'Client',
//       status: userData.status || 'Published',
//       avatar: userData.avatar || null,
//       phone: userData.phone || null,
//       bio: userData.bio || null,
//       lastLogin: null,
//       isActive: true,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };

//     const docRef = await usersRef.add(newUser);
//     return { id: docRef.id, ...newUser };
//   }

//   // Find user by email
//   static async findByEmail(email) {
//     const usersRef = this.getCollection();
//     const snapshot = await usersRef.where('email', '==', email.toLowerCase()).limit(1).get();

//     if (snapshot.empty) {
//       return null;
//     }

//     const doc = snapshot.docs[0];
//     return { id: doc.id, ...doc.data() };
//   }

//   // Find user by ID
//   static async findById(id) {
//     const usersRef = this.getCollection();
//     const doc = await usersRef.doc(id).get();

//     if (!doc.exists) {
//       return null;
//     }

//     return { id: doc.id, ...doc.data() };
//   }

//   // Get all users with filters
//   static async findAll(filters = {}) {
//     let query = this.getCollection();

//     // Apply filters
//     if (filters.role) {
//       query = query.where('role', '==', filters.role);
//     }

//     if (filters.status) {
//       query = query.where('status', '==', filters.status);
//     }

//     // Get results
//     const snapshot = await query.orderBy('createdAt', 'desc').get();

//     const users = [];
//     snapshot.forEach(doc => {
//       users.push({ id: doc.id, ...doc.data() });
//     });

//     // Apply search filter (client-side since Firestore doesn't support LIKE)
//     if (filters.search) {
//       const searchLower = filters.search.toLowerCase();
//       return users.filter(user => 
//         user.name.toLowerCase().includes(searchLower) ||
//         user.email.toLowerCase().includes(searchLower)
//       );
//     }

//     return users;
//   }

//   // Update user
//   static async update(id, updateData) {
//     const usersRef = this.getCollection();
    
//     const updates = {
//       ...updateData,
//       updatedAt: new Date().toISOString()
//     };

//     // Don't include password in regular updates
//     delete updates.password;

//     await usersRef.doc(id).update(updates);
//     return await this.findById(id);
//   }

//   // Update password
//   static async updatePassword(id, newPassword) {
//     const usersRef = this.getCollection();
//     const hashedPassword = await this.hashPassword(newPassword);

//     await usersRef.doc(id).update({
//       password: hashedPassword,
//       updatedAt: new Date().toISOString()
//     });
//   }

//   // Delete user
//   static async delete(id) {
//     const usersRef = this.getCollection();
//     await usersRef.doc(id).delete();
//   }

//   // Count documents
//   static async count(filters = {}) {
//     const users = await this.findAll(filters);
//     return users.length;
//   }

//   // Get statistics
//   static async getStats() {
//     const allUsers = await this.findAll();

//     return {
//       total: allUsers.length,
//       byStatus: {
//         published: allUsers.filter(u => u.status === 'Published').length,
//         restricted: allUsers.filter(u => u.status === 'Restricted').length,
//         suspended: allUsers.filter(u => u.status === 'Suspended').length
//       },
//       byRole: {
//         admin: allUsers.filter(u => u.role === 'Admin').length,
//         support: allUsers.filter(u => u.role === 'Support').length,
//         client: allUsers.filter(u => u.role === 'Client').length
//       }
//     };
//   }
// }

// module.exports = User;

const { getFirestore, FieldValue } = require('../config/firebase');

class User {
  static collection() {
    return getFirestore().collection('users');
  }

  /**
   * Create or update a user profile in Firestore
   * Only stores app-specific data (status, role, etc.)
   */
  static async upsert(uid, data) {
    if (!uid) throw new Error('Missing uid');

    const cleanData = {
      uid, // reference sa Auth user
      status: typeof data.status === 'string' ? data.status.trim() : 'active', // default
      role: typeof data.role === 'string' ? data.role.trim() : 'client', // optional
      updatedAt: FieldValue.serverTimestamp(),
      ...data // merge any other app-specific fields
    };

    await this.collection().doc(uid).set(cleanData, { merge: true });
  }

  static async get(uid) {
    if (!uid) throw new Error('Missing uid');
    const doc = await this.collection().doc(uid).get();
    return doc.exists ? doc.data() : null;
  }

  static async delete(uid) {
    if (!uid) throw new Error('Missing uid');
    await this.collection().doc(uid).delete();
  }
}

module.exports = User;
