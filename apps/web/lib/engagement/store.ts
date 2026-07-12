import 'server-only'
import { randomUUID } from 'node:crypto'
import pg from 'pg'

type BookmarkInput={anonymousId:string;userId?:string;articleSlug:string;articleCategory:string;articleTitleNe:string}
type CommentInput={articleSlug:string;articleCategory:string;authorName:string;authorEmail?:string;authorUserId?:string;bodyNe:string;parentId?:string;locale:'ne'|'en'}
type PollVoteInput={pollId:string;optionId:string;voterFingerprint:string;voterUserId?:string}
type ReadingInput={anonymousId:string;userId?:string;articleSlug:string;articleCategory:string;articleTitleNe:string;readPercent:number}

let pool:pg.Pool|null=null
function getPool(){
  if(process.env.NEXT_PHASE==='phase-production-build') return null
  if(!process.env.DATABASE_URL) return null
  pool ??= new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:undefined})
  return pool
}
async function ensureSchema(){const p=getPool();if(!p)return;await p.query(`
CREATE TABLE IF NOT EXISTS nw_bookmarks(id text primary key, owner_key text not null, article_slug text not null, article_category text, article_title_ne text, created_at timestamptz default now(), unique(owner_key,article_slug));
CREATE TABLE IF NOT EXISTS nw_comments(id text primary key, article_slug text not null, article_category text, author_name text not null, author_email text, author_user_id text, body_ne text not null, parent_id text, locale text not null default 'ne', status text not null default 'pending', created_at timestamptz default now());
CREATE TABLE IF NOT EXISTS nw_poll_votes(id text primary key, poll_id text not null, option_id text not null, voter_key text not null, created_at timestamptz default now(), unique(poll_id,voter_key));
CREATE TABLE IF NOT EXISTS nw_reading(id text primary key, owner_key text not null, article_slug text not null, article_category text, article_title_ne text, read_percent integer not null, read_at timestamptz default now(), unique(owner_key,article_slug));`)}
function owner(anonymousId:string,userId?:string){return userId?`user:${userId}`:`anon:${anonymousId}`}
const bookmarks=new Map<string,BookmarkInput>()
const comments:Array<any>=[]
const votes=new Set<string>()
const readings=new Map<string,ReadingInput>()

export async function addBookmark(input:BookmarkInput){const p=getPool();if(p){await ensureSchema();await p.query(`insert into nw_bookmarks(id,owner_key,article_slug,article_category,article_title_ne) values($1,$2,$3,$4,$5) on conflict(owner_key,article_slug) do update set article_category=excluded.article_category,article_title_ne=excluded.article_title_ne`,[randomUUID(),owner(input.anonymousId,input.userId),input.articleSlug,input.articleCategory,input.articleTitleNe]);return}bookmarks.set(`${owner(input.anonymousId,input.userId)}:${input.articleSlug}`,input)}
export async function removeBookmark(anonymousId:string,userId:string|undefined,articleSlug:string){const p=getPool();if(p){await ensureSchema();await p.query('delete from nw_bookmarks where owner_key=$1 and article_slug=$2',[owner(anonymousId,userId),articleSlug]);return}bookmarks.delete(`${owner(anonymousId,userId)}:${articleSlug}`)}
export async function getBookmarks(anonymousId:string,userId?:string){const p=getPool();if(p){await ensureSchema();const r=await p.query('select article_slug as "articleSlug",article_category as "articleCategory",article_title_ne as "articleTitleNe",created_at as "createdAt" from nw_bookmarks where owner_key=$1 order by created_at desc',[owner(anonymousId,userId)]);return r.rows}return [...bookmarks.entries()].filter(([k])=>k.startsWith(owner(anonymousId,userId)+':')).map(([,v])=>v)}
export async function createComment(input:CommentInput){const item={id:randomUUID(),...input,status:'pending',createdAt:new Date().toISOString()};const p=getPool();if(p){await ensureSchema();await p.query(`insert into nw_comments(id,article_slug,article_category,author_name,author_email,author_user_id,body_ne,parent_id,locale,status) values($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')`,[item.id,input.articleSlug,input.articleCategory,input.authorName,input.authorEmail??null,input.authorUserId??null,input.bodyNe,input.parentId??null,input.locale]);return item}comments.push(item);return item}
export async function getCommentsForArticle(articleSlug:string){const p=getPool();if(p){await ensureSchema();const r=await p.query(`select id,author_name as "authorName",body_ne as "bodyNe",parent_id as "parentId",locale,created_at as "createdAt" from nw_comments where article_slug=$1 and status='approved' order by created_at asc`,[articleSlug]);return r.rows}return comments.filter(c=>c.articleSlug===articleSlug&&c.status==='approved')}
export async function recordPollVote(input:PollVoteInput){const key=`${input.pollId}:${input.voterUserId??input.voterFingerprint}`;const p=getPool();if(p){await ensureSchema();const r=await p.query(`insert into nw_poll_votes(id,poll_id,option_id,voter_key) values($1,$2,$3,$4) on conflict(poll_id,voter_key) do nothing returning id`,[randomUUID(),input.pollId,input.optionId,input.voterUserId??input.voterFingerprint]);return{recorded:r.rowCount===1}}if(votes.has(key))return{recorded:false};votes.add(key);return{recorded:true}}
export async function recordReading(input:ReadingInput){const p=getPool();if(p){await ensureSchema();await p.query(`insert into nw_reading(id,owner_key,article_slug,article_category,article_title_ne,read_percent) values($1,$2,$3,$4,$5,$6) on conflict(owner_key,article_slug) do update set read_percent=excluded.read_percent,read_at=now()`,[randomUUID(),owner(input.anonymousId,input.userId),input.articleSlug,input.articleCategory,input.articleTitleNe,Math.round(input.readPercent)]);return}readings.set(`${owner(input.anonymousId,input.userId)}:${input.articleSlug}`,input)}

export type CommentStatus='pending'|'approved'|'rejected'|'flagged'
export async function updateCommentStatus(commentId:string,status:CommentStatus){const p=getPool();if(p){await ensureSchema();const r=await p.query('update nw_comments set status=$2 where id=$1',[commentId,status]);return Number(r.rowCount??0)>0}return false}
