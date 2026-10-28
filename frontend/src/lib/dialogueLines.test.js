import test from 'node:test'
import assert from 'node:assert/strict'
import {conversationLines,labelledDialogueLines} from './dialogueLines.js'

test('existing labelled text becomes two speaker bubbles',()=>{
 const text='Speaker 1\n“എന്താ തന്റെ പേര് രാമാനുജൻ?”\n\nSpeaker 2\n“രാമന്റെ ഏത് അനുജൻ?”'
 const lines=conversationLines(undefined,text,'Speaker 1: Question\nSpeaker 2: Reply')
 assert.deepEqual(lines.map(line=>line.speaker),[1,2])
 assert.equal(lines[0].dialogue,'“എന്താ തന്റെ പേര് രാമാനുജൻ?”')
 assert.equal(lines[1].dialogue_english,'Reply')
 assert.deepEqual(labelledDialogueLines('Normal dialogue about Speaker 1'),[])
 assert.deepEqual(labelledDialogueLines('Speaker 1\nOnly one speaker'),[])
 assert.deepEqual(labelledDialogueLines('Speaker 1\n\nSpeaker 2\nReply'),[])
})

test('structured lines take precedence and unmatched translations are not misassigned',()=>{
 const structured=[{speaker:2,dialogue:'Reply'}]
 assert.equal(conversationLines(structured,'',''),structured)
 const text='Speaker 1: Question\nSpeaker 2: Reply'
 assert.equal(conversationLines(null,text,'Speaker 2: English\nSpeaker 1: Other')[0].dialogue_english,'')
})
