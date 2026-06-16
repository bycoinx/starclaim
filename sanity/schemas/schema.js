import { defineSchema } from 'sanity'
import author from './author'
import post from './post'
import settings from './settings'

export default defineSchema({
  name: 'default',
  types: [author, post, settings],
})
