import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ArrowDownRight, ArrowUpRight, BarChart3, BookOpen, CalendarRange, Loader2, RefreshCcw, TrendingUp } from 'lucide-react';
import { hotelApiService } from '../../api/hotel.service';
import ReportsOwnerService from '../../api/reports.owner.service';
import reviewService from '../../api/review.service';
import blogService from '../../api/blog.service';

const normalizeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const currencyFormat = (value = 0) =>
  normalizeNumber(value).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const toISODate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const defaultFilters = () => {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 5);
  return {
    date_from: toISODate(from),
    date_to: toISODate(to),
    hotel_id: 'ALL',
  };
};

const normalizeHotel = (hotel, fallbackIndex = 0) => {
  const id =
    hotel?.hotel_id ??
    hotel?.hotelId ??
    hotel?.id ??
    hotel?.hotelID ??
    hotel?.id_hotel ??
    null;
  const normalizedId = id ? String(id) : `hotel-${fallbackIndex}`;
  const name = hotel?.name ?? hotel?.hotel_name ?? hotel?.hotelName ?? 'Khách sạn';
  const city = hotel?.city ?? hotel?.hotel_city ?? hotel?.hotelCity ?? '';
  return { id: normalizedId, name, city };
};

const getMonthKey = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-');
  return `${m}/${y}`;
};

const previousMonthKey = (monthKey) => {
  if (!monthKey) return null;
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const buildMonthRange = (from, to) => {
  if (!from || !to) return [];
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return [];
  start.setDate(1);
  const end = new Date(to);
  if (Number.isNaN(end.getTime())) return [];
  end.setDate(1);
  const cursor = new Date(start);
  const range = [];
  while (cursor <= end) {
    range.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return range;
};

const categorizeReviews = (reviews) => {
  const buckets = { positive: 0, neutral: 0, negative: 0 };
  reviews.forEach((review) => {
    const rating = Number(review?.rating ?? 0);
    if (rating >= 4) buckets.positive += 1;
    else if (rating >= 2) buckets.neutral += 1;
    else if (rating > 0) buckets.negative += 1;
  });
  return { ...buckets, total: buckets.positive + buckets.neutral + buckets.negative };
};

const withinRange = (value, start, end) => {
  if (!value || !start || !end) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d >= start && d <= end;
};

const REVIEW_COLORS = ['#22c55e', '#facc15', '#ef4444'];

const HotelDashboardPage = () => {
  const [hotelRawData, setHotelRawData] = useState([]);
  const [filters, setFilters] = useState(() => defaultFilters());
  const [editorFilters, setEditorFilters] = useState(() => defaultFilters());
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [reviewStore, setReviewStore] = useState({});
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState({ base: true, reviews: false, blogs: false });
  const [error, setError] = useState('');
  const [showAllHotels, setShowAllHotels] = useState(false);

  const normalizedHotels = useMemo(() => {
    const map = new Map();
    hotelRawData.forEach((hotel, index) => {
      const normalized = normalizeHotel(hotel, index);
      if (!map.has(normalized.id)) {
        map.set(normalized.id, normalized);
      }
    });
    return Array.from(map.values());
  }, [hotelRawData]);

  const hotelLookup = useMemo(() => {
    const map = {};
    normalizedHotels.forEach((hotel) => {
      map[hotel.id] = hotel;
    });
    return map;
  }, [normalizedHotels]);

  const activeHotelIds = useMemo(() => {
    if (!filters.hotel_id || filters.hotel_id === 'ALL') {
      return normalizedHotels.map((hotel) => hotel.id);
    }
    return [filters.hotel_id];
  }, [filters.hotel_id, normalizedHotels]);

  const fetchHotels = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, base: true }));
      const response = await hotelApiService.getHotelsForOwner();
      const data = response?.data ?? response?.hotels ?? response ?? [];
      setHotelRawData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading owner hotels:', err);
      setError(err?.response?.data?.message || err.message || 'Không thể tải danh sách khách sạn');
    } finally {
      setLoading((prev) => ({ ...prev, base: false }));
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    if (!filters.date_from || !filters.date_to) return;
    setLoading((prev) => ({ ...prev, base: true }));
    setError('');
    try {
      const params = {
        date_from: filters.date_from,
        date_to: filters.date_to,
      };
      if (filters.hotel_id && filters.hotel_id !== 'ALL') {
        params.hotel_id = filters.hotel_id;
      }
      const res = await ReportsOwnerService.getPayments(params);
      const rows = Array.isArray(res?.data) ? res.data : res?.rows ?? [];
      setPayments(rows);
      const aggregated = rows.reduce(
        (acc, row) => {
          const gross = normalizeNumber(row?.finalAmount);
          const net = normalizeNumber(row?.hotelNetAmount);
          acc.total_payments += 1;
          acc.total_gross += gross;
          acc.total_net += net;
          acc.total_pg_fee += normalizeNumber(row?.pgFeeAmount);
          acc.total_admin_fee += normalizeNumber(row?.adminFeeAmount);
          return acc;
        },
        { total_payments: 0, total_gross: 0, total_net: 0, total_pg_fee: 0, total_admin_fee: 0 }
      );
      setPaymentStats(aggregated);
    } catch (err) {
      console.error('Error loading owner payments:', err);
      setError(err?.response?.data?.message || err.message || 'Không thể tải dữ liệu tài chính');
      setPayments([]);
      setPaymentStats(null);
    } finally {
      setLoading((prev) => ({ ...prev, base: false }));
    }
  }, [filters]);

  const fetchReviews = useCallback(async () => {
    if (!normalizedHotels.length) {
      setReviewStore({});
      return;
    }
    setLoading((prev) => ({ ...prev, reviews: true }));
    try {
      const promises = normalizedHotels.map(async (hotel) => {
        try {
          const res = await reviewService.getPagedByHotelId(hotel.id, 1, 200);
          return { hotelId: hotel.id, reviews: res?.data ?? [] };
        } catch (err) {
          console.warn('Failed to load reviews for hotel', hotel.id, err);
          return { hotelId: hotel.id, reviews: [] };
        }
      });
      const results = await Promise.all(promises);
      const map = {};
      results.forEach(({ hotelId, reviews }) => {
        map[hotelId] = Array.isArray(reviews) ? reviews : [];
      });
      setReviewStore(map);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err?.response?.data?.message || err.message || 'Không thể tải dữ liệu đánh giá');
    } finally {
      setLoading((prev) => ({ ...prev, reviews: false }));
    }
  }, [normalizedHotels]);

  const fetchBlogs = useCallback(async () => {
    setLoading((prev) => ({ ...prev, blogs: true }));
    try {
      const res = await blogService.getOwnerBlogs({
        limit: 100,
        sortBy: 'updated_at',
        sortOrder: 'desc',
      });
      const posts = Array.isArray(res?.data) ? res.data : res?.blogs ?? [];
      const normalized = posts.map((post, index) => ({
        id: post?.blogId ?? post?.blog_id ?? post?.id ?? `blog-${index}`,
        hotelId: String(
          post?.hotelId ??
            post?.hotel_id ??
            post?.hotel?.hotelId ??
            post?.hotel?.hotel_id ??
            ''
        ),
        title: post?.title ?? 'Bài viết',
        status: post?.status ?? 'draft',
        likeCount: post?.likeCount ?? post?.like_count ?? 0,
        commentCount: post?.commentCount ?? post?.comment_count ?? 0,
        viewCount: post?.viewCount ?? post?.view_count ?? 0,
        createdAt: post?.createdAt ?? post?.created_at,
      }));
      setBlogs(normalized);
    } catch (err) {
      console.error('Error loading blogs:', err);
      setError(err?.response?.data?.message || err.message || 'Không thể tải dữ liệu bài viết');
      setBlogs([]);
    } finally {
      setLoading((prev) => ({ ...prev, blogs: false }));
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const filteredPayments = useMemo(() => {
    if (!payments?.length) return [];
    if (!filters.hotel_id || filters.hotel_id === 'ALL') return payments;
    return payments.filter((row) => String(row.hotelId) === filters.hotel_id);
  }, [payments, filters.hotel_id]);

  const monthlyAggregation = useMemo(() => {
    const map = {};
    const perHotel = {};
    filteredPayments.forEach((row) => {
      const month = getMonthKey(row?.bizDateVn || row?.paidAt || row?.createdAt);
      if (!month) return;
      if (!map[month]) {
        map[month] = { revenue: 0, bookings: new Set() };
      }
      const net = normalizeNumber(row?.hotelNetAmount ?? row?.finalAmount);
      map[month].revenue += net;
      if (row?.bookingId) map[month].bookings.add(row.bookingId);

      const hotelId = String(row?.hotelId ?? '');
      if (!perHotel[hotelId]) perHotel[hotelId] = {};
      if (!perHotel[hotelId][month]) {
        perHotel[hotelId][month] = { revenue: 0, bookings: new Set() };
      }
      perHotel[hotelId][month].revenue += net;
      if (row?.bookingId) perHotel[hotelId][month].bookings.add(row.bookingId);
    });

    buildMonthRange(filters.date_from, filters.date_to).forEach((monthKey) => {
      if (!map[monthKey]) {
        map[monthKey] = { revenue: 0, bookings: new Set() };
      }
    });

    const months = Object.keys(map).sort();
    const chartData = months.map((key) => ({
      monthKey: key,
      label: formatMonthLabel(key),
      revenue: Math.round(map[key]?.revenue ?? 0),
      bookings: map[key]?.bookings?.size ?? 0,
    }));
    return { chartData, perHotel };
  }, [filteredPayments, filters.date_from, filters.date_to]);

  const topHotels = useMemo(() => {
    const map = {};
    filteredPayments.forEach((row) => {
      const hotelId = String(row?.hotelId ?? '');
      if (!hotelId) return;
      if (!map[hotelId]) {
        map[hotelId] = { net: 0, gross: 0, bookings: new Set(), hotelName: row?.hotelName, hotelCity: row?.hotelCity };
      }
      map[hotelId].net += normalizeNumber(row?.hotelNetAmount);
      map[hotelId].gross += normalizeNumber(row?.finalAmount);
      if (row?.bookingId) map[hotelId].bookings.add(row.bookingId);
    });
    const result = Object.entries(map).map(([hotelId, stats]) => ({
      hotelId,
      hotelName: hotelLookup[hotelId]?.name ?? stats.hotelName ?? 'Khách sạn',
      city: hotelLookup[hotelId]?.city ?? stats.hotelCity ?? '',
      totalNet: stats.net,
      totalGross: stats.gross,
      bookingCount: stats.bookings.size,
    }));
    result.sort((a, b) => b.totalNet - a.totalNet);
    return result.slice(0, 4);
  }, [filteredPayments, hotelLookup]);

  const revenueComparison = useMemo(() => {
    const analysisMonth = getMonthKey(filters.date_to);
    const prevMonth = previousMonthKey(analysisMonth);
    const rows = activeHotelIds.map((hotelId) => {
      const hotel = hotelLookup[hotelId] ?? { name: 'Khách sạn' };
      const stats = monthlyAggregation.perHotel?.[hotelId] ?? {};
      const current = Math.round(normalizeNumber(stats[analysisMonth]?.revenue ?? 0));
      const previous = Math.round(normalizeNumber(stats[prevMonth]?.revenue ?? 0));
      const delta = current - previous;
      const deltaPercent = previous > 0 ? (delta / previous) * 100 : previous === 0 && current > 0 ? 100 : 0;
      return {
        hotelId,
        hotelName: hotel.name,
        city: hotel.city,
        current,
        previous,
        delta,
        deltaPercent,
      };
    });
    rows.sort((a, b) => b.current - a.current);
    return rows;
  }, [activeHotelIds, hotelLookup, monthlyAggregation.perHotel, filters.date_to]);
  const displayedComparison = showAllHotels ? revenueComparison : revenueComparison.slice(0, 5);
  const hasMoreHotels = revenueComparison.length > 5;

  const reviewInsight = useMemo(() => {
    const start = filters.date_from ? new Date(`${filters.date_from}T00:00:00`) : null;
    const end = filters.date_to ? new Date(`${filters.date_to}T23:59:59`) : null;
    const perHotel = [];
    const summary = { positive: 0, neutral: 0, negative: 0 };
    activeHotelIds.forEach((hotelId) => {
      const hotelReviews = reviewStore[hotelId] ?? [];
      const inRange = start && end ? hotelReviews.filter((review) => withinRange(review?.createdAt, start, end)) : hotelReviews;
      const result = categorizeReviews(inRange);
      if (result.total > 0 || hotelReviews.length > 0) {
        perHotel.push({
          hotelId,
          hotelName: hotelLookup[hotelId]?.name ?? 'Khách sạn',
          ...result,
        });
      }
      summary.positive += result.positive;
      summary.neutral += result.neutral;
      summary.negative += result.negative;
    });
    return {
      summary: { ...summary, total: summary.positive + summary.neutral + summary.negative },
      perHotel,
    };
  }, [activeHotelIds, reviewStore, filters.date_from, filters.date_to, hotelLookup]);

  const blogHighlights = useMemo(() => {
    const start = filters.date_from ? new Date(`${filters.date_from}T00:00:00`) : null;
    const end = filters.date_to ? new Date(`${filters.date_to}T23:59:59`) : null;
    const activeSet = new Set(activeHotelIds);
    return blogs
      .filter((blog) => {
        const matchesHotel =
          !blog.hotelId ||
          activeSet.size === 0 ||
          activeSet.has(blog.hotelId);
        if (!matchesHotel) return false;
        if (!start || !end) return true;
        return withinRange(blog.createdAt, start, end);
      })
      .map((blog) => ({
        ...blog,
        interactions:
          normalizeNumber(blog.likeCount) +
          normalizeNumber(blog.commentCount) +
          normalizeNumber(blog.viewCount),
      }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 4);
  }, [blogs, activeHotelIds, filters.date_from, filters.date_to]);

  const primaryStats = useMemo(() => {
    const computed = filteredPayments.reduce(
      (acc, row) => {
        acc.total_gross += normalizeNumber(row?.finalAmount);
        acc.total_net += normalizeNumber(row?.hotelNetAmount);
        acc.total_payments += 1;
        return acc;
      },
      { total_gross: 0, total_net: 0, total_payments: 0 }
    );
    const gross = paymentStats?.total_gross ?? computed.total_gross;
    const net = paymentStats?.total_net ?? computed.total_net;
    const count = paymentStats?.total_payments ?? computed.total_payments;
    return [
      { label: 'Tổng doanh thu', value: gross, icon: <TrendingUp className="w-5 h-5" />, accent: 'from-emerald-500 to-lime-500' },
      { label: 'Thu nhập thực nhận', value: net, icon: <BarChart3 className="w-5 h-5" />, accent: 'from-indigo-500 to-sky-500' },
      { label: 'Số giao dịch', value: count, isPlainNumber: true, icon: <CalendarRange className="w-5 h-5" />, accent: 'from-rose-500 to-orange-500' },
    ];
  }, [paymentStats, filteredPayments]);

  const handleDateChange = (field, value) => {
    setEditorFilters((prev) => ({ ...prev, [field]: value }));
  };

  const applyQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setEditorFilters((prev) => ({
      ...prev,
      date_from: toISODate(start),
      date_to: toISODate(end),
    }));
  };

  const handleApplyFilters = () => {
    setFilters(editorFilters);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">Bảng điều khiển</p>
            <h1 className="text-3xl font-bold text-slate-900">Hiệu suất các khách sạn của bạn</h1>
            <p className="text-slate-600 mt-1">
              Theo dõi doanh thu, trải nghiệm khách và mức độ tương tác nội dung của từng khách sạn.
            </p>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Bộ lọc dữ liệu</h2>
              <p className="text-sm text-slate-500">Chọn phạm vi thời gian và khách sạn để phân tích.</p>
            </div>
            <button
              onClick={handleApplyFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50"
              disabled={loading.base}
            >
              <RefreshCcw className="w-4 h-4" />
              Áp dụng
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Từ ngày</label>
              <input
                type="date"
                value={editorFilters.date_from}
                max={editorFilters.date_to}
                onChange={(e) => handleDateChange('date_from', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Đến ngày</label>
              <input
                type="date"
                value={editorFilters.date_to}
                min={editorFilters.date_from}
                onChange={(e) => handleDateChange('date_to', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-slate-600 block mb-1">Khách sạn</label>
              <select
                value={editorFilters.hotel_id}
                onChange={(e) => handleDateChange('hotel_id', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              >
                <option value="ALL">Tất cả khách sạn của tôi</option>
                {normalizedHotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name} {hotel.city ? `- ${hotel.city}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-500">
            {[7, 30, 90, 180].map((days) => (
              <button
                key={days}
                className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-100 transition"
                onClick={() => applyQuickRange(days)}
              >
                {days === 7 ? '7 ngày' : days === 30 ? '30 ngày' : days === 90 ? '90 ngày' : '6 tháng'}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {primaryStats.map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl p-5 bg-gradient-to-br ${item.accent} text-white shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide opacity-80">{item.label}</p>
                  <p className="text-2xl font-bold mt-2">
                    {item.isPlainNumber ? Number(item.value || 0).toLocaleString('vi-VN') : currencyFormat(item.value)}
                  </p>
                </div>
                <div className="bg-white/20 rounded-full p-2">{item.icon}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Xu hướng doanh thu & booking</h3>
                <p className="text-sm text-slate-500">Doanh thu ròng và số lượng booking mỗi tháng.</p>
              </div>
            </div>
            {monthlyAggregation.chartData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyAggregation.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis yAxisId="left" stroke="#94a3b8" tickFormatter={(value) => `${(value / 1_000_000).toFixed(0)}tr`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                    <Tooltip formatter={(value, name) => (name === 'bookings' ? value : currencyFormat(value))} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} />
                    <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#22c55e" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                Chưa có dữ liệu doanh thu trong khoảng thời gian này.
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Khách sạn doanh thu cao</h3>
              <p className="text-sm text-slate-500">Xếp hạng theo thu nhập ròng.</p>
            </div>
            {topHotels.length ? (
              <div className="space-y-3">
                {topHotels.map((hotel, index) => (
                  <div key={hotel.hotelId} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{hotel.hotelName}</p>
                      <p className="text-xs text-slate-500">{hotel.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Thu nhập</p>
                      <p className="font-semibold text-slate-900">{currencyFormat(hotel.totalNet)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa có giao dịch để xếp hạng.</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">So sánh doanh số theo khách sạn</h3>
                <p className="text-sm text-slate-500">So sánh tháng hiện tại và tháng trước.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2">Khách sạn</th>
                    <th className="py-2">Tháng này</th>
                    <th className="py-2">Tháng trước</th>
                    <th className="py-2">Xu hướng</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedComparison.map((row) => (
                    <tr key={row.hotelId} className="border-b border-slate-50 last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-slate-900">{row.hotelName}</p>
                        <p className="text-xs text-slate-500">{row.city}</p>
                      </td>
                      <td className="py-3">{currencyFormat(row.current)}</td>
                      <td className="py-3 text-slate-500">{currencyFormat(row.previous)}</td>
                      <td className="py-3">
                        <div
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            row.delta >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {row.delta >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {row.deltaPercent ? `${row.deltaPercent.toFixed(1)}%` : '0%'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMoreHotels && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllHotels((prev) => !prev)}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 underline"
                  >
                    {showAllHotels ? 'Thu gọn danh sách' : 'Xem tất cả khách sạn'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Booking mỗi tháng</h3>
                <p className="text-sm text-slate-500">Số booking phát sinh trong khoảng thời gian đã chọn.</p>
              </div>
            </div>
            {monthlyAggregation.chartData.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyAggregation.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Chưa có booking trong khoảng thời gian này.
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Tỷ lệ phản hồi của khách</h3>
                <p className="text-sm text-slate-500">4-5 sao là tích cực, 2-3 sao trung lập, 1 sao tiêu cực.</p>
              </div>
              {loading.reviews && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
            </div>
            {reviewInsight.summary.total ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Tích cực', value: reviewInsight.summary.positive },
                          { name: 'Bình thường', value: reviewInsight.summary.neutral },
                          { name: 'Tiêu cực', value: reviewInsight.summary.negative },
                        ]}
                        dataKey="value"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {REVIEW_COLORS.map((color, idx) => (
                          <Cell key={color} fill={color} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 text-sm">
                  {reviewInsight.perHotel.map((hotel) => (
                    <div key={hotel.hotelId} className="p-3 border border-slate-100 rounded-xl">
                      <p className="font-semibold text-slate-900">{hotel.hotelName}</p>
                      <p className="text-xs text-slate-500 mb-2">{hotel.total} đánh giá</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-600 font-semibold">{hotel.positive} tích cực</span>
                        <span className="text-yellow-600 font-semibold">{hotel.neutral} bình thường</span>
                        <span className="text-rose-600 font-semibold">{hotel.negative} tiêu cực</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa có đánh giá nào trong thời gian này.</p>
            )}
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Bài viết tương tác cao</h3>
                <p className="text-sm text-slate-500">Bao gồm lượt xem, thích và bình luận.</p>
              </div>
              {loading.blogs && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
            </div>
            {blogHighlights.length ? (
              <div className="space-y-4">
                {blogHighlights.map((blog) => (
                  <div key={blog.id} className="flex items-start gap-3 p-4 border border-slate-100 rounded-2xl">
                    <div className="rounded-full bg-slate-100 p-3">
                      <BookOpen className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{blog.title}</p>
                      <p className="text-xs text-slate-500">{hotelLookup[blog.hotelId]?.name ?? 'Khách sạn'}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span>👁 {blog.viewCount}</span>
                        <span>❤️ {blog.likeCount}</span>
                        <span>💬 {blog.commentCount}</span>
                        <span className="text-slate-900 font-semibold">Tổng: {blog.interactions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa có bài viết nào được tương tác trong thời gian này.</p>
            )}
          </div>
        </section>

        {loading.base && (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải dữ liệu dashboard...
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDashboardPage;
