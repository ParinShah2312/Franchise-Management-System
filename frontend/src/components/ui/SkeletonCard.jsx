import PropTypes from 'prop-types';

export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse ${className}`}>
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  );
}

SkeletonCard.propTypes = {
  className: PropTypes.string,
};
