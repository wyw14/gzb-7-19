<template>
  <div class="handover-points-page">
    <div class="page-header">
      <div class="container">
        <h1>📍 安全交接点</h1>
        <p>平台认证的公共交接地点，让乐器交易更安全、更放心</p>
      </div>
    </div>
    
    <div class="container">
      <div class="filter-bar card mb-20">
        <div class="filter-row">
          <div class="filter-group">
            <label>类型</label>
            <el-select v-model="filters.type" placeholder="全部" clearable size="default" style="width: 140px">
              <el-option v-for="t in pointTypes" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </div>
          <div class="filter-group">
            <label>区域</label>
            <el-select v-model="filters.district" placeholder="全部" clearable size="default" style="width: 140px">
              <el-option v-for="d in districts" :key="d" :label="d" :value="d" />
            </el-select>
          </div>
          <div class="filter-group search-group">
            <el-input v-model="filters.keyword" placeholder="搜索交接点名称/地址" clearable style="width: 280px">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <el-button type="primary" @click="loadData">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
      
      <div class="result-header mb-20">
        <span>共找到 <b>{{ points.length }}</b> 个安全交接点</span>
        <div class="sort-wrap">
          <span>排序：</span>
          <el-radio-group v-model="sortBy" size="small">
            <el-radio-button value="rating">评分</el-radio-button>
            <el-radio-button value="name">名称</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <div v-if="sortedPoints.length" class="grid grid-3 gap-20">
        <div v-for="point in sortedPoints" :key="point.id" class="point-card card" @click="showDetail(point)">
          <div class="point-header">
            <div class="point-icon" :class="`icon-${point.type}`">
              {{ getTypeIcon(point.type) }}
            </div>
            <div class="point-basic">
              <h3 class="point-name">{{ point.name }}</h3>
              <span class="point-type">{{ point.typeLabel }}</span>
            </div>
            <div class="point-rating">
              <el-icon><Star /></el-icon>
              <span class="rating-num">{{ point.rating }}</span>
              <span class="rating-count">({{ point.reviewCount }})</span>
            </div>
          </div>
          
          <div class="point-address">
            <el-icon><Location /></el-icon>
            <span>{{ point.address }}</span>
          </div>
          
          <div class="point-facilities">
            <span v-for="f in point.facilities.slice(0, 4)" :key="f" class="facility-tag">{{ f }}</span>
            <span v-if="point.facilities.length > 4" class="facility-tag">+{{ point.facilities.length - 4 }}</span>
          </div>
          
          <div class="point-hours">
            <el-icon><Clock /></el-icon>
            <span>今日开放：{{ getTodayHours(point.openingHours) }}</span>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-icon><Location /></el-icon>
        <p>暂无符合条件的交接点</p>
      </div>
    </div>
    
    <el-dialog v-model="detailVisible" :title="selectedPoint?.name" width="600px" class="detail-dialog">
      <div v-if="selectedPoint" class="point-detail">
        <div class="detail-header">
          <div class="point-icon large" :class="`icon-${selectedPoint.type}`">
            {{ getTypeIcon(selectedPoint.type) }}
          </div>
          <div class="detail-title">
            <h2>{{ selectedPoint.name }}</h2>
            <div class="detail-meta">
              <span class="badge badge-primary">{{ selectedPoint.typeLabel }}</span>
              <span class="rating">
                <el-icon><Star /></el-icon>
                {{ selectedPoint.rating }} ({{ selectedPoint.reviewCount }}评价)
              </span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4><el-icon><Location /></el-icon> 地址</h4>
          <p>{{ selectedPoint.address }}</p>
        </div>
        
        <div class="detail-section">
          <h4><el-icon><Phone /></el-icon> 联系方式</h4>
          <p>{{ selectedPoint.phone }} ({{ selectedPoint.contactPerson }})</p>
        </div>
        
        <div class="detail-section">
          <h4><el-icon><Clock /></el-icon> 开放时间</h4>
          <div class="hours-grid">
            <div v-for="(hours, day) in selectedPoint.openingHours" :key="day" class="hours-row">
              <span class="day-label">{{ getDayLabel(day) }}</span>
              <span class="hours-value" :class="{ closed: hours === '休息' }">{{ hours }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4><el-icon><CircleCheck /></el-icon> 设施服务</h4>
          <div class="facility-list">
            <span v-for="f in selectedPoint.facilities" :key="f" class="facility-item">
              <el-icon><Check /></el-icon>
              {{ f }}
            </span>
          </div>
        </div>
        
        <div class="detail-section">
          <h4><el-icon><Document /></el-icon> 交接说明</h4>
          <p class="notes">{{ selectedPoint.notes }}</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="ratePoint">
          <el-icon><Star /></el-icon>
          评价此交接点
        </el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="rateVisible" title="评价交接点" width="400px">
      <el-form :model="rateForm" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="rateForm.rating" show-text :texts="['差评', '一般', '良好', '很好', '非常好']" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rateVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRate">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { handoverPointApi } from '../api'
import { ElMessage } from 'element-plus'
import { Search, Location, Star, Clock, Phone, CircleCheck, Document, Check } from '@element-plus/icons-vue'

const points = ref([])
const detailVisible = ref(false)
const rateVisible = ref(false)
const selectedPoint = ref(null)
const submitting = ref(false)

const pointTypes = [
  { value: 'music_school', label: '音乐教室' },
  { value: 'cafe', label: '咖啡馆' },
  { value: 'community', label: '社区中心' },
  { value: 'library', label: '图书馆' },
  { value: 'venue', label: '演出场地' }
]

const filters = reactive({
  type: '',
  district: '',
  keyword: ''
})

const rateForm = reactive({
  rating: 5
})

const sortBy = ref('rating')

const districts = computed(() => {
  const set = new Set()
  points.value.forEach(p => p.district && set.add(p.district))
  return Array.from(set)
})

const sortedPoints = computed(() => {
  const arr = [...points.value]
  if (sortBy.value === 'rating') {
    return arr.sort((a, b) => b.rating - a.rating)
  } else {
    return arr.sort((a, b) => a.name.localeCompare(b.name))
  }
})

const getTypeIcon = (type) => {
  const icons = {
    music_school: '🎹',
    cafe: '☕',
    community: '🏢',
    library: '📚',
    venue: '🎸'
  }
  return icons[type] || '📍'
}

const getDayLabel = (day) => {
  const labels = {
    monday: '周一',
    tuesday: '周二',
    wednesday: '周三',
    thursday: '周四',
    friday: '周五',
    saturday: '周六',
    sunday: '周日'
  }
  return labels[day] || day
}

const getTodayHours = (openingHours) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = days[new Date().getDay()]
  return openingHours[today] || '未知'
}

const loadData = async () => {
  try {
    points.value = await handoverPointApi.list({
      type: filters.type || undefined,
      district: filters.district || undefined,
      keyword: filters.keyword || undefined
    })
  } catch (e) {
    points.value = []
    ElMessage.error('加载失败')
  }
}

const resetFilters = () => {
  filters.type = ''
  filters.district = ''
  filters.keyword = ''
  loadData()
}

const showDetail = (point) => {
  selectedPoint.value = point
  detailVisible.value = true
}

const ratePoint = () => {
  rateForm.rating = 5
  rateVisible.value = true
}

const submitRate = async () => {
  if (!selectedPoint.value) return
  submitting.value = true
  try {
    await handoverPointApi.review(selectedPoint.value.id, { rating: rateForm.rating })
    ElMessage.success('评价成功！')
    rateVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('评价失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.filter-bar {
  padding: 20px 24px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.search-group {
  flex-direction: row;
  align-items: center;
  gap: 0;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.result-header b {
  color: var(--primary-color);
  font-size: 16px;
}

.sort-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.point-card {
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.point-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.point-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.point-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.point-icon.large {
  width: 64px;
  height: 64px;
  font-size: 32px;
}

.icon-music_school {
  background: #fef3c7;
}

.icon-cafe {
  background: #fed7aa;
}

.icon-community {
  background: #dbeafe;
}

.icon-library {
  background: #e0e7ff;
}

.icon-venue {
  background: #fce7f3;
}

.point-basic {
  flex: 1;
  min-width: 0;
}

.point-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.point-type {
  font-size: 12px;
  color: var(--primary-color);
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.point-rating {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #f59e0b;
  font-size: 14px;
}

.rating-num {
  font-weight: 600;
}

.rating-count {
  color: var(--text-secondary);
  font-size: 12px;
}

.point-address {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.point-facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.facility-tag {
  padding: 2px 8px;
  background: var(--bg-light);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.point-hours {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--success-color);
  font-size: 13px;
}

.detail-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.detail-title h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-meta .rating {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #f59e0b;
  font-size: 14px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  margin: 0 0 8px 0;
  color: var(--text-secondary);
}

.detail-section p {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.6;
}

.hours-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.hours-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-light);
  border-radius: 6px;
  font-size: 13px;
}

.day-label {
  color: var(--text-secondary);
}

.hours-value {
  color: var(--text-primary);
  font-weight: 500;
}

.hours-value.closed {
  color: var(--danger-color);
}

.facility-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.facility-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #ecfdf5;
  color: #047857;
  border-radius: 6px;
  font-size: 13px;
}

.notes {
  background: var(--bg-light);
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

@media (max-width: 900px) {
  .grid-3 {
    grid-template-columns: 1fr;
  }
}
</style>
