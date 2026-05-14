import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../../../../firebase';

export const SocialService = {
  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    const mySocialRef = doc(db, 'social', currentUserId);
    const targetSocialRef = doc(db, 'social', targetUserId);
    const myUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    await runTransaction(db, async (transaction) => {
      const mySocialSnap = await transaction.get(mySocialRef);
      const targetSocialSnap = await transaction.get(targetSocialRef);
      const myUserSnap = await transaction.get(myUserRef);
      const targetUserSnap = await transaction.get(targetUserRef);

      const mySocial = mySocialSnap.exists() ? mySocialSnap.data() : { following: [], followers: [] };
      const targetSocial = targetSocialSnap.exists() ? targetSocialSnap.data() : { following: [], followers: [] };

      // Ensure arrays exist
      const myFollowing = Array.isArray(mySocial.following) ? mySocial.following : [];
      const targetFollowers = Array.isArray(targetSocial.followers) ? targetSocial.followers : [];

      if (!myFollowing.includes(targetUserId)) {
        myFollowing.push(targetUserId);
        // Only create/update mySocial
        transaction.set(mySocialRef, { ...mySocial, following: myFollowing }, { merge: true });
        
        // Update user count
        if (myUserSnap.exists()) {
          const myUser = myUserSnap.data();
          const currentCount = typeof myUser.followingCount === 'number' ? myUser.followingCount : 0;
          transaction.update(myUserRef, { followingCount: currentCount + 1 });
        }
      }

      if (!targetFollowers.includes(currentUserId)) {
        targetFollowers.push(currentUserId);
        // Only create/update targetSocial
        transaction.set(targetSocialRef, { ...targetSocial, followers: targetFollowers }, { merge: true });

        // Update target count
        if (targetUserSnap.exists()) {
          const targetUser = targetUserSnap.data();
          const currentCount = typeof targetUser.followersCount === 'number' ? targetUser.followersCount : 0;
          transaction.update(targetUserRef, { followersCount: currentCount + 1 });
        }
      }
    });
  },

  async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    const mySocialRef = doc(db, 'social', currentUserId);
    const targetSocialRef = doc(db, 'social', targetUserId);
    const myUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    await runTransaction(db, async (transaction) => {
      const mySocialSnap = await transaction.get(mySocialRef);
      const targetSocialSnap = await transaction.get(targetSocialRef);
      const myUserSnap = await transaction.get(myUserRef);
      const targetUserSnap = await transaction.get(targetUserRef);

      if (mySocialSnap.exists()) {
        const mySocial = mySocialSnap.data();
        const myFollowing = Array.isArray(mySocial.following) ? mySocial.following : [];
        if (myFollowing.includes(targetUserId)) {
            const updatedFollowing = myFollowing.filter(id => id !== targetUserId);
            transaction.set(mySocialRef, { ...mySocial, following: updatedFollowing }, { merge: true });

            if (myUserSnap.exists()) {
              const myUser = myUserSnap.data();
              const currentCount = typeof myUser.followingCount === 'number' ? myUser.followingCount : 0;
              transaction.update(myUserRef, { followingCount: Math.max(0, currentCount - 1) });
            }
        }
      }

      if (targetSocialSnap.exists()) {
        const targetSocial = targetSocialSnap.data();
        const targetFollowers = Array.isArray(targetSocial.followers) ? targetSocial.followers : [];
        if (targetFollowers.includes(currentUserId)) {
            const updatedFollowers = targetFollowers.filter(id => id !== currentUserId);
            transaction.set(targetSocialRef, { ...targetSocial, followers: updatedFollowers }, { merge: true });

            if (targetUserSnap.exists()) {
              const targetUser = targetUserSnap.data();
              const currentCount = typeof targetUser.followersCount === 'number' ? targetUser.followersCount : 0;
              transaction.update(targetUserRef, { followersCount: Math.max(0, currentCount - 1) });
            }
        }
      }
    });
  }
};
