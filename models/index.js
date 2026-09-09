require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

// =========================
// Admin
// =========================
const Admin = sequelize.define(
  "Admin",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "admins",
    timestamps: true,
  }
);

// =========================
// Category
// =========================
const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "categories",
    timestamps: true,
  }
);

// =========================
// Product
// =========================
const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    oldPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    discount: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "products",
    timestamps: true,
  }
);
// =========================
// Article
// =========================
const Article = sequelize.define(
  "Article",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    metaTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    metaDescription: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    metaKeywords: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "articles",
    timestamps: true,
  }
);
// =========================
// Project
// =========================
const Project = sequelize.define(
  "Project",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    tag: {
      type: DataTypes.STRING, // مثال: "مظلات"، "أعمال معدنية"
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // للتحكم في ترتيب ظهور المشاريع
    },
  },
  {
    tableName: "projects",
    timestamps: true,
  }
);

// =========================
// Service
// =========================
const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    tag: {
      type: DataTypes.STRING, // مثال: "الشماسي"، "السواتر"
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // للتحكم في ترتيب ظهور الخدمات
    },
  },
  {
    tableName: "services",
    timestamps: true,
  }
);
// =========================
// HeroSlide
// =========================
const HeroSlide = sequelize.define(
  "HeroSlide",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    label: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    buttonText: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    buttonLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    videoThumbnail: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    videoText: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "hero_slides",
    timestamps: true,
  }
);

// =========================
// Setting
// =========================
const Setting = sequelize.define(
  "Setting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },

    siteName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    siteNameEn: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    phoneIntl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    whatsapp: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    facebook: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    instagram: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    twitter: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    linkedin: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "settings",
    timestamps: true,
  }
);

// =========================
// Order
// =========================
const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    secondaryPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    paymentMethod: {
      type: DataTypes.ENUM("cod", "vodafone_cash", "instapay"),
      allowNull: false,
      defaultValue: "cod",
    },

    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    items: {
      type: DataTypes.JSON,
      allowNull: false,
    },

    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    shippingFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "shipping",
        "completed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  }
);

// =========================
// PushSubscription
// =========================
const PushSubscription = sequelize.define(
  "PushSubscription",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    endpoint: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },

    p256dh: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    auth: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "push_subscriptions",
    timestamps: true,
  }
);
// =========================
// WorkSection
// =========================

const WorkSection = sequelize.define(
  "WorkSection",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(280),
      allowNull: false,
      unique: true,
    },

    shortDescription: {
      type: DataTypes.STRING(600),
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "work_sections",
    timestamps: true,
  }
);
// =========================
// WorkSectionImage
// =========================

const WorkSectionImage = sequelize.define(
  "WorkSectionImage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    workSectionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    image: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "work_section_images",
    timestamps: true,
  }
);
// =========================
// Relationships
// =========================

Category.hasMany(Product, {
  foreignKey: "categoryId",
  onDelete: "SET NULL",
});

Product.belongsTo(Category, {
  foreignKey: "categoryId",
});
// =========================
// Work Section Relationships
// =========================

WorkSection.hasMany(WorkSectionImage, {
  foreignKey: "workSectionId",
  onDelete: "CASCADE",
});

WorkSectionImage.belongsTo(WorkSection, {
  foreignKey: "workSectionId",
});
// =========================
// Exports
// =========================

module.exports = {
  sequelize,
  Admin,
  Category,
  Product,
  Article,
  Project,
  Service,
  HeroSlide,
  Setting,
  Order,
  PushSubscription,
  WorkSection,
  WorkSectionImage,
};