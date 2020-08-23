import React from 'react';
import moment from 'moment';
import styles from './Meta.module.scss';


const Meta = ({ date }) => (
  <div className={styles['meta']}>
    <span className={styles['meta__date']}> {moment(date).format('YYYY-MM-DD')}</span>
  </div>
);

export default Meta;
