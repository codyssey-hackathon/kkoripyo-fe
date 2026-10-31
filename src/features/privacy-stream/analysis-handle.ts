import { z } from 'zod'

export const analysisHandleSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@/, '').toLowerCase())
  .pipe(
    z
      .string()
      .min(1, 'Instagram 아이디를 입력해 주세요.')
      .max(30, '아이디는 30자 이내로 입력해 주세요.')
      .regex(
        /^[a-z0-9._]+$/,
        '영문, 숫자, 마침표(.), 밑줄(_)만 사용할 수 있어요.',
      ),
  )
