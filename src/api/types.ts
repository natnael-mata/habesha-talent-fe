export type Category = 'song' | 'dance' | 'comedy' | 'poetry' | 'instrument'

export type SubscriberStatus = 'active' | 'blocked'
export type VideoStatus = 'pending' | 'approved' | 'removed'

/** Mirrors the `subscribers` table in PLAN.md § 6 exactly. */
export interface Subscriber {
  id: number
  phone_number: string
  display_name: string | null
  status: SubscriberStatus
  created_on: string
  /* password_hash is deliberately absent from anything the client can see. */
}

/** Mirrors the `videos` table in PLAN.md § 6. */
export interface Video {
  id: number
  subscriber_id: number
  title: string
  video_path: string | null
  thumbnail_path: string | null
  view_count: number
  status: VideoStatus
  posted_on: string
  /* Not in the v1 schema — carried here so the print generator and the
     category label have something to work from. Add as a column in v2. */
  category: Category
  duration_s: number
}

/** What the list/detail endpoints actually return: the video joined to the
 *  creator, with the phone already masked server-side. */
export interface VideoWithCreator extends Video {
  creator: {
    id: number
    display_name: string | null
    phone_masked: string
  }
}

export interface Page<T> {
  items: T[]
  page: number
  page_size: number
  total: number
  has_more: boolean
}

export interface Session {
  token: string
  subscriber: Subscriber
}

export type ApiErrorCode =
  | 'invalid_login'
  | 'phone_taken'
  | 'phone_format'
  | 'password_short'
  | 'blocked'
  | 'rate_limited'
  | 'not_found'
  | 'file_type'
  | 'file_size'
  | 'title_required'
  | 'title_long'
  | 'network'

export class ApiError extends Error {
  code: ApiErrorCode
  constructor(code: ApiErrorCode) {
    super(code)
    this.code = code
    this.name = 'ApiError'
  }
}

/** Maps a server error code to the Amharic string key. Every failure the
 *  API can produce has a translation; there is no English fallback path. */
export const ERROR_KEY: Record<ApiErrorCode, string> = {
  invalid_login: 'invalid_login',
  phone_taken: 'err_phone_taken',
  phone_format: 'err_phone_format',
  password_short: 'err_password_short',
  blocked: 'err_blocked',
  rate_limited: 'err_rate_limited',
  not_found: 'not_found_title',
  file_type: 'err_file_type',
  file_size: 'err_file_size',
  title_required: 'err_title_required',
  title_long: 'err_title_long',
  network: 'err_network',
}
