import PropTypes from 'prop-types';
import React from 'react';
import FieldSet from 'Components/FieldSet';
import Link from 'Components/Link/Link';
import PageSectionContent from 'Components/Page/PageSectionContent';
import TagConnector from './TagConnector';
import styles from './Tags.css';

function Tags(props) {
  const {
    items,
    ...otherProps
  } = props;

  if (!items.length) {
    return (
      <div>No tags have been added yet. Add tags to link authors with delay profiles, restrictions, or notifications. Click <Link to='https://wiki.servarr.com/Readarr_Settings#Tags'>here</Link> to find out more about tags in Readarr.</div>
    );
  }

  return (
    <FieldSet
      legend="Tags"
    >
      <PageSectionContent
        errorMessage="Unable to load Tags"
        {...otherProps}
      >
        <div className={styles.tags}>
          {
            items.map((item) => {
              return (
                <TagConnector
                  key={item.id}
                  {...item}
                />
              );
            })
          }
        </div>
      </PageSectionContent>
    </FieldSet>
  );
}

Tags.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Tags;
