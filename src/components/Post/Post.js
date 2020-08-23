// @flow strict
import React from 'react';
import { Link } from 'gatsby';
import Author from './Author';
import conf from '../../../config';
// import Comments from './Comments';
import Content from './Content';
import Meta from './Meta';
// import Tags from './Tags';
import styles from './Post.module.scss';
// import type { Node } from '../../types';

// type Props = {
//   post: Node
// };

const Post = ({ children, title = 'TITLE', PUBDATE, publishUrl }) => {
  // const  =  args
  // const { html } = post;
  // const { tagSlugs, slug } = post.fields;
  // const { tags, title, date } = post.frontmatter;
  return (
    <div className={styles['post']}>

      <div className={styles['post__content']}>
         <Content body={children} title={title} />
      </div>

      <div className={styles['post__footer']}>
        
        <Meta date={PUBDATE} publishUrl={conf.url + publishUrl} />
        {/* {tags && tagSlugs && <Tags tags={tags} tagSlugs={tagSlugs} />} */}
        <Author />
      </div>

      <div className={styles['post__comments']}>
        {/* <Comments postSlug={slug} postTitle={post.frontmatter.title} /> */}
      </div>
      <Link className={styles['post__home-button']} to="/">All Articles</Link>

    </div>
  );
};

export default Post;
