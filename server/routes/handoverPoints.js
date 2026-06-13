const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/storage');

const router = express.Router();

const typeLabels = {
  music_school: '音乐教室',
  cafe: '咖啡馆',
  community: '社区中心',
  library: '图书馆',
  venue: '演出场地'
};

router.get('/', (req, res) => {
  const points = readJSON('handover_points.json', []);
  const { city, district, type, keyword, isActive } = req.query;
  
  let result = points.filter(p => p.isActive);
  
  if (isActive !== undefined) {
    result = result.filter(p => p.isActive === (isActive === 'true'));
  }
  if (city) {
    result = result.filter(p => p.city.includes(city));
  }
  if (district) {
    result = result.filter(p => p.district.includes(district));
  }
  if (type) {
    result = result.filter(p => p.type === type);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(kw) || 
      p.address.toLowerCase().includes(kw) ||
      p.notes.toLowerCase().includes(kw)
    );
  }
  
  const enriched = result.map(p => ({
    ...p,
    typeLabel: typeLabels[p.type] || p.type
  }));
  
  enriched.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  
  res.json(enriched);
});

router.get('/:id', (req, res) => {
  const points = readJSON('handover_points.json', []);
  const point = points.find(p => p.id === req.params.id);
  
  if (!point) {
    return res.status(404).json({ error: '交接点不存在' });
  }
  
  const result = {
    ...point,
    typeLabel: typeLabels[point.type] || point.type
  };
  
  res.json(result);
});

router.post('/', (req, res) => {
  const points = readJSON('handover_points.json', []);
  
  const newPoint = {
    id: 'hp' + uuidv4().slice(0, 8),
    ...req.body,
    isActive: true,
    rating: req.body.rating || 5.0,
    reviewCount: req.body.reviewCount || 0,
    createdAt: new Date().toISOString()
  };
  
  points.push(newPoint);
  writeJSON('handover_points.json', points);
  
  res.json({ success: true, point: newPoint });
});

router.put('/:id', (req, res) => {
  const points = readJSON('handover_points.json', []);
  const idx = points.findIndex(p => p.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: '交接点不存在' });
  }
  
  points[idx] = { ...points[idx], ...req.body, id: points[idx].id };
  writeJSON('handover_points.json', points);
  
  res.json({ success: true, point: points[idx] });
});

router.delete('/:id', (req, res) => {
  const points = readJSON('handover_points.json', []);
  const idx = points.findIndex(p => p.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: '交接点不存在' });
  }
  
  points[idx].isActive = false;
  writeJSON('handover_points.json', points);
  
  res.json({ success: true });
});

router.post('/:id/review', (req, res) => {
  const points = readJSON('handover_points.json', []);
  const idx = points.findIndex(p => p.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: '交接点不存在' });
  }
  
  const { rating } = req.body;
  const point = points[idx];
  const totalRating = (point.rating || 5) * (point.reviewCount || 0) + rating;
  const newCount = (point.reviewCount || 0) + 1;
  
  point.rating = Math.round((totalRating / newCount) * 10) / 10;
  point.reviewCount = newCount;
  
  writeJSON('handover_points.json', points);
  
  res.json({ success: true, point });
});

module.exports = router;
