import get from 'lodash/get';
import User from '../models/user.model';

import io from '../socket';

export const socketEmitEvent = async ({ ownerId, eventName, eventData }) => {
  try {
    const user = await User.findById(ownerId);
    const targetIds = [...get(user, 'followers'), ownerId];

    targetIds.map((id) => io.getIO().to(id).emit(eventName, eventData));
  } catch (err) {
    console.log(err);
  }
};
