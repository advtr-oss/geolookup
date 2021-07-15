module.exports._geo_distance = (location) => {
  return {
    _geo_distance: {
      location,
      order: 'asc',
      unit: 'km',
      mode: 'min',
      distance_type: 'arc',
      ignore_unmapped: true
    }
  }
}
