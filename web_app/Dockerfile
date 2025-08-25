FROM node:18-alpine

# Thay đổi registry sang mirror để giảm lỗi Too Many Requests
RUN npm config set registry https://registry.npmmirror.com

WORKDIR /app

# Copy chỉ package.json để cache layer npm install
COPY package*.json ./

# Cài dependencies, thêm --legacy-peer-deps để tránh conflict
RUN npm install --legacy-peer-deps

# Copy toàn bộ source code sau khi cài xong dependencies
COPY . .

EXPOSE 80

# Build project
CMD ["npm", "run", "build"]

# Nếu muốn serve build bằng nginx:
# FROM nginx:alpine
# COPY --from=0 /app/build /usr/share/nginx/html
# EXPOSE 80
