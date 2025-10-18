import React from 'react';
import PropTypes from 'prop-types';

const FeatureCard = ({ title, desc, icon }) => {
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-md bg-indigo-50 text-indigo-600 text-xl"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-600 mt-1">{desc}</p>
      </div>
    </div>
  );
};

FeatureCard.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string,
  icon: PropTypes.node
};

FeatureCard.defaultProps = {
  desc: '',
  icon: null
};

export default FeatureCard;
