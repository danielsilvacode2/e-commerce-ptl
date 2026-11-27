import UpdateProfileAction from '@/src/actions/me/update_profile'
import { createUpdateProfileNameUseCase } from './update-profile-name'

export {
  createUpdateProfileNameUseCase,
  ProfileValidationError,
} from './update-profile-name'
export type {
  UpdateProfileNameInput,
  UpdateProfileNameUseCase,
  UserProfileRepository,
} from './update-profile-name'

export const updateProfileNameUseCase = createUpdateProfileNameUseCase({
  updateProfile: UpdateProfileAction,
})
