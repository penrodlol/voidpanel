import { formatDate } from '@/libs/formatter';
import { pageSchema, stringSchema, type PageSchema } from '@/libs/schema';
import supabase from '@/libs/supabase';
import * as Card from '@/ui/card';
import { User } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPosts } from './action';
import Filter from './filter';
import View from './view';

export const revalidate = 28800;

async function getData(page: PageSchema) {
  const posts = await getPosts(page);
  const sites = await supabase.from('site').select('name');
  if (sites.error) return undefined;
  return { posts, sites: sites.data.map((site) => site.name) };
}

export default async function Page(props: { params: { page: string } }) {
  const params = z.object({ page: pageSchema }).safeParse(props.params);
  if (!params.success) redirect('/');

  const data = await getData(params.data.page);
  if (!data) redirect('/');

  const postCookie = cookies().get('post')?.value;
  const sitesCookie = cookies().get('sites')?.value;
  const post = stringSchema.parse(postCookie ?? '');
  const sitesSelected = z.array(stringSchema).parse(sitesCookie ? JSON.parse(sitesCookie) : []);

  return (
    <div className="mx-auto mt-fluid-4 flex max-w-screen-md flex-col gap-fluid-3">
      <section className="flex flex-col gap-2 border-b pb-fluid-4">
        <h1 className="font-serif text-5xl uppercase tracking-widest text-fancy">all posts</h1>
        <p className="max-w-[55ch]">Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      </section>
      <section className="flex justify-between border-b pb-fluid-3 text-xs">
        <Filter sites={data.sites} post={post} sitesSelected={sitesSelected} />
        <View />
      </section>
      <section>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {data.posts?.map((post) => (
            <li key={post.slug}>
              <Card.Root href={`/posts/${post.slug}`}>
                <Card.Header>
                  <p className="flex items-center gap-2">
                    <User size={14} aria-hidden /> {post.site.name}
                  </p>
                  <time dateTime={new Date(post.pub_date).toISOString()}>
                    {formatDate(post.pub_date)}
                  </time>
                </Card.Header>
                <Card.Body>{post.title}</Card.Body>
              </Card.Root>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
