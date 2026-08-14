/* Which backend the app talks to.
 *
 * Real API by default. `VITE_USE_MOCK=true` switches to the in-memory mock,
 * which is what the Ethio Telecom pitch runs on: no server, no database, no
 * network at all, so a meeting room with a dead connection cannot break the
 * demo.
 *
 * Both modules export the same names with the same signatures, so no page,
 * component or hook knows or cares which one it got.
 */

import * as http from './http'
import * as mock from './mock'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const impl = USE_MOCK ? mock : http

export const login = impl.login
export const currentSession = impl.currentSession
export const logout = impl.logout
export const listVideos = impl.listVideos
export const getVideo = impl.getVideo
export const recordView = impl.recordView
export const listBySubscriber = impl.listBySubscriber
export const uploadVideo = impl.uploadVideo
export const maskPhone = impl.maskPhone
export const normalisePhone = impl.normalisePhone
export const MAX_UPLOAD_BYTES = impl.MAX_UPLOAD_BYTES
export const ACCEPTED_TYPES = impl.ACCEPTED_TYPES
