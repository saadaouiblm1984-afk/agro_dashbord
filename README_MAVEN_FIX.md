# إصلاح مشاكل Maven

## المشاكل التي تم إصلاحها:

### 1. **MySQL Connector**
- **المشكلة**: `mysql:mysql-connector-java` غير مدعوم
- **الحل**: تم تغييره إلى `com.mysql:mysql-connector-j` version 8.2.0

### 2. **Chart.js WebJar**
- **المشكلة**: `org.webjars:chart.js` غير موجود
- **الحل**: تم تغييره إلى `org.webjars.npm:chart.js` version 4.4.1

## خطوات الحل:

### 1. **تنظيف المشروع**
```bash
# في Windows PowerShell
./mvnw clean

# أو إذا كان Maven مثبتاً
mvn clean
```

### 2. **إعادة بناء المشروع**
```bash
# في Windows PowerShell
./mvnw install

# أو إذا كان Maven مثبتاً
mvn install
```

### 3. **تحديث الـ Dependencies**
```bash
# في Windows PowerShell
./mvnw dependency:resolve

# أو إذا كان Maven مثبتاً
mvn dependency:resolve
```

## ملف pom.xml المُحسَّن:

تم تحديث التبعيات التالية:
- MySQL Connector: `com.mysql:mysql-connector-j:8.2.0`
- Chart.js: `org.webjars.npm:chart.js:4.4.1`

## إذا استمرت المشاكل:

### 1. **حذف مجلد .m2**
```bash
# حذف مجلد Maven المحلي
rm -rf ~/.m2/repository
# أو في Windows
rmdir /s %USERPROFILE%\.m2\repository
```

### 2. **إعادة بناء من الصفر**
```bash
./mvnw clean install -U
```

### 3. **التحقق من إعدادات Maven**
تأكد من أن `settings.xml` في `~/.m2/` صحيح.

## اختبار البناء:

بعد إصلاح المشاكل، يجب أن يعمل البناء بنجاح:

```bash
./mvnw spring-boot:run
```

## ملاحظات:

- تم تحديث MySQL إلى الإصدار الأحدث المتوافق
- تم استخدام WebJar صحيح لـ Chart.js
- قد تحتاج إلى تحديث الـ IDE لقراءة التغييرات
