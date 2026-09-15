import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('de', 'ar', 'en');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'board', 'editor', 'viewer');
  CREATE TYPE "public"."enum_categories_type" AS ENUM('news', 'event', 'service', 'expert');
  CREATE TYPE "public"."enum_news_bundesland" AS ENUM('W', 'NOE', 'OOE', 'SBG', 'T', 'VBG', 'STMK', 'KTN', 'BGLD');
  CREATE TYPE "public"."enum_news_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum_news_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_version_bundesland" AS ENUM('W', 'NOE', 'OOE', 'SBG', 'T', 'VBG', 'STMK', 'KTN', 'BGLD');
  CREATE TYPE "public"."enum__news_v_version_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum__news_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_published_locale" AS ENUM('de', 'ar', 'en');
  CREATE TYPE "public"."enum_events_bundesland" AS ENUM('W', 'NOE', 'OOE', 'SBG', 'T', 'VBG', 'STMK', 'KTN', 'BGLD');
  CREATE TYPE "public"."enum_events_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_bundesland" AS ENUM('W', 'NOE', 'OOE', 'SBG', 'T', 'VBG', 'STMK', 'KTN', 'BGLD');
  CREATE TYPE "public"."enum__events_v_version_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_published_locale" AS ENUM('de', 'ar', 'en');
  CREATE TYPE "public"."enum_services_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_version_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum__services_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_published_locale" AS ENUM('de', 'ar', 'en');
  CREATE TYPE "public"."enum_guide_articles_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum_guide_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guide_articles_v_version_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum__guide_articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guide_articles_v_published_locale" AS ENUM('de', 'ar', 'en');
  CREATE TYPE "public"."enum_roadmaps_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum_roadmaps_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__roadmaps_v_version_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum__roadmaps_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__roadmaps_v_published_locale" AS ENUM('de', 'ar', 'en');
  CREATE TYPE "public"."enum_experts_verification_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_experts_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum_experts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__experts_v_version_verification_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__experts_v_version_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum__experts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__experts_v_published_locale" AS ENUM('de', 'ar', 'en');
  CREATE TYPE "public"."enum_partners_type" AS ENUM('funder', 'partner', 'sponsor');
  CREATE TYPE "public"."enum_pages_blocks_hero_variant" AS ENUM('default', 'image', 'compact');
  CREATE TYPE "public"."enum_pages_blocks_rich_text_width" AS ENUM('default', 'wide');
  CREATE TYPE "public"."enum_pages_blocks_image_text_image_position" AS ENUM('start', 'end');
  CREATE TYPE "public"."enum_pages_blocks_card_grid_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_pages_blocks_stats_variant" AS ENUM('light', 'dark', 'green');
  CREATE TYPE "public"."enum_pages_blocks_cta_band_variant" AS ENUM('green', 'navy', 'blue');
  CREATE TYPE "public"."enum_pages_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_variant" AS ENUM('default', 'image', 'compact');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_width" AS ENUM('default', 'wide');
  CREATE TYPE "public"."enum__pages_v_blocks_image_text_image_position" AS ENUM('start', 'end');
  CREATE TYPE "public"."enum__pages_v_blocks_card_grid_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__pages_v_blocks_stats_variant" AS ENUM('light', 'dark', 'green');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_band_variant" AS ENUM('green', 'navy', 'blue');
  CREATE TYPE "public"."enum__pages_v_version_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('de', 'ar', 'en');
  CREATE TYPE "public"."enum_contact_submissions_locale" AS ENUM('de', 'ar', 'en');
  CREATE TYPE "public"."enum_contact_submissions_status" AS ENUM('new', 'read', 'archived');
  CREATE TYPE "public"."enum_site_settings_social_links_platform" AS ENUM('facebook', 'instagram', 'youtube', 'linkedin', 'twitter', 'tiktok');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"credit" varchar,
  	"consent_on_file" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_categories_type" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cover_image_id" integer,
  	"category_id" integer,
  	"author" varchar,
  	"published_at" timestamp(3) with time zone,
  	"bundesland" "enum_news_bundesland",
  	"featured" boolean DEFAULT false,
  	"review_status" "enum_news_review_status" DEFAULT 'draft',
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "news_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_news_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_cover_image_id" integer,
  	"version_category_id" integer,
  	"version_author" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_bundesland" "enum__news_v_version_bundesland",
  	"version_featured" boolean DEFAULT false,
  	"version_review_status" "enum__news_v_version_review_status" DEFAULT 'draft',
  	"version_seo_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__news_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_news_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cover_image_id" integer,
  	"category_id" integer,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"address" varchar,
  	"bundesland" "enum_events_bundesland",
  	"is_online" boolean DEFAULT false,
  	"registration_url" varchar,
  	"capacity" numeric,
  	"is_free" boolean DEFAULT true,
  	"review_status" "enum_events_review_status" DEFAULT 'draft',
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "events_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"description" jsonb,
  	"location_name" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_cover_image_id" integer,
  	"version_category_id" integer,
  	"version_start_date" timestamp(3) with time zone,
  	"version_end_date" timestamp(3) with time zone,
  	"version_address" varchar,
  	"version_bundesland" "enum__events_v_version_bundesland",
  	"version_is_online" boolean DEFAULT false,
  	"version_registration_url" varchar,
  	"version_capacity" numeric,
  	"version_is_free" boolean DEFAULT true,
  	"version_review_status" "enum__events_v_version_review_status" DEFAULT 'draft',
  	"version_seo_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__events_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_events_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" jsonb,
  	"version_location_name" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pillar_id" integer,
  	"icon" varchar,
  	"image_id" integer,
  	"review_status" "enum_services_review_status" DEFAULT 'draft',
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_services_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "services_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"body" jsonb,
  	"target_audience" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "services_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer
  );
  
  CREATE TABLE "_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_pillar_id" integer,
  	"version_icon" varchar,
  	"version_image_id" integer,
  	"version_review_status" "enum__services_v_version_review_status" DEFAULT 'draft',
  	"version_seo_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__services_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__services_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_services_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_body" jsonb,
  	"version_target_audience" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer
  );
  
  CREATE TABLE "service_pillars" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"colour_token" varchar,
  	"order" numeric DEFAULT 99 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "service_pillars_locales" (
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "guide_topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"order" numeric DEFAULT 99 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "guide_topics_locales" (
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "guide_articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"topic_id" integer,
  	"cover_image_id" integer,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"review_interval_months" numeric DEFAULT 6,
  	"official_source_url" varchar,
  	"review_status" "enum_guide_articles_review_status" DEFAULT 'draft',
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_guide_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "guide_articles_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "guide_articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"roadmaps_id" integer,
  	"experts_id" integer
  );
  
  CREATE TABLE "_guide_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_topic_id" integer,
  	"version_cover_image_id" integer,
  	"version_last_reviewed_at" timestamp(3) with time zone,
  	"version_review_interval_months" numeric DEFAULT 6,
  	"version_official_source_url" varchar,
  	"version_review_status" "enum__guide_articles_v_version_review_status" DEFAULT 'draft',
  	"version_seo_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__guide_articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__guide_articles_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_guide_articles_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guide_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"roadmaps_id" integer,
  	"experts_id" integer
  );
  
  CREATE TABLE "roadmaps_steps_required_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "roadmaps_steps_required_documents_locales" (
  	"document" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "roadmaps_steps_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "roadmaps_steps_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "roadmaps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"linked_guide_article_id" integer
  );
  
  CREATE TABLE "roadmaps_steps_locales" (
  	"title" varchar,
  	"description" varchar,
  	"responsible_authority" varchar,
  	"timing" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "roadmaps" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"review_interval_months" numeric DEFAULT 6,
  	"official_source_url" varchar,
  	"review_status" "enum_roadmaps_review_status" DEFAULT 'draft',
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_roadmaps_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "roadmaps_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_roadmaps_v_version_steps_required_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_roadmaps_v_version_steps_required_documents_locales" (
  	"document" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_roadmaps_v_version_steps_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_roadmaps_v_version_steps_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_roadmaps_v_version_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"linked_guide_article_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_roadmaps_v_version_steps_locales" (
  	"title" varchar,
  	"description" varchar,
  	"responsible_authority" varchar,
  	"timing" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_roadmaps_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_icon" varchar,
  	"version_last_reviewed_at" timestamp(3) with time zone,
  	"version_review_interval_months" numeric DEFAULT 6,
  	"version_official_source_url" varchar,
  	"version_review_status" "enum__roadmaps_v_version_review_status" DEFAULT 'draft',
  	"version_seo_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__roadmaps_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__roadmaps_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_roadmaps_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "experts_languages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" varchar
  );
  
  CREATE TABLE "experts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"city" varchar,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"website" varchar,
  	"photo_id" integer,
  	"consent_on_file" boolean DEFAULT false,
  	"consent_date" timestamp(3) with time zone,
  	"verification_status" "enum_experts_verification_status" DEFAULT 'unverified',
  	"verified_at" timestamp(3) with time zone,
  	"review_status" "enum_experts_review_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_experts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "experts_locales" (
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "experts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "_experts_v_version_languages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"language" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_experts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_city" varchar,
  	"version_contact_email" varchar,
  	"version_contact_phone" varchar,
  	"version_website" varchar,
  	"version_photo_id" integer,
  	"version_consent_on_file" boolean DEFAULT false,
  	"version_consent_date" timestamp(3) with time zone,
  	"version_verification_status" "enum__experts_v_version_verification_status" DEFAULT 'unverified',
  	"version_verified_at" timestamp(3) with time zone,
  	"version_review_status" "enum__experts_v_version_review_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__experts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__experts_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_experts_v_locales" (
  	"version_bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_experts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "board_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"photo_id" integer,
  	"email" varchar,
  	"show_email" boolean DEFAULT false,
  	"linked_in" varchar,
  	"show_linked_in" boolean DEFAULT false,
  	"order" numeric DEFAULT 99 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "board_members_locales" (
  	"role" varchar NOT NULL,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"logo_id" integer NOT NULL,
  	"url" varchar,
  	"type" "enum_partners_type" NOT NULL,
  	"order" numeric DEFAULT 99 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"body" varchar,
  	"image_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"variant" "enum_pages_blocks_hero_variant" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"width" "enum_pages_blocks_rich_text_width" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_image_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"heading" varchar,
  	"body" jsonb,
  	"image_position" "enum_pages_blocks_image_text_image_position" DEFAULT 'start',
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"image_id" integer,
  	"heading" varchar,
  	"body" varchar,
  	"url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "pages_blocks_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"columns" "enum_pages_blocks_card_grid_columns" DEFAULT '3',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"variant" "enum_pages_blocks_stats_variant" DEFAULT 'light',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"variant" "enum_pages_blocks_cta_band_variant" DEFAULT 'green',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
  );
  
  CREATE TABLE "pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_logo_grid_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"name" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "pages_blocks_logo_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" varchar,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"show_form" boolean DEFAULT true,
  	"contact_details_show_address" boolean DEFAULT true,
  	"contact_details_show_phone" boolean DEFAULT true,
  	"contact_details_show_email" boolean DEFAULT true,
  	"contact_details_show_hours" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"review_status" "enum_pages_review_status" DEFAULT 'draft',
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"body" varchar,
  	"image_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"variant" "enum__pages_v_blocks_hero_variant" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"width" "enum__pages_v_blocks_rich_text_width" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_image_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"heading" varchar,
  	"body" jsonb,
  	"image_position" "enum__pages_v_blocks_image_text_image_position" DEFAULT 'start',
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"image_id" integer,
  	"heading" varchar,
  	"body" varchar,
  	"url" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"columns" "enum__pages_v_blocks_card_grid_columns" DEFAULT '3',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"variant" "enum__pages_v_blocks_stats_variant" DEFAULT 'light',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"variant" "enum__pages_v_blocks_cta_band_variant" DEFAULT 'green',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_logo_grid_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"name" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_logo_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" varchar,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"show_form" boolean DEFAULT true,
  	"contact_details_show_address" boolean DEFAULT true,
  	"contact_details_show_phone" boolean DEFAULT true,
  	"contact_details_show_email" boolean DEFAULT true,
  	"contact_details_show_hours" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_review_status" "enum__pages_v_version_review_status" DEFAULT 'draft',
  	"version_seo_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "contact_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"subject" varchar,
  	"category" varchar,
  	"message" varchar NOT NULL,
  	"locale" "enum_contact_submissions_locale",
  	"consent_given" boolean DEFAULT false NOT NULL,
  	"status" "enum_contact_submissions_status" DEFAULT 'new',
  	"submitted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"categories_id" integer,
  	"news_id" integer,
  	"events_id" integer,
  	"services_id" integer,
  	"service_pillars_id" integer,
  	"guide_topics_id" integer,
  	"guide_articles_id" integer,
  	"roadmaps_id" integer,
  	"experts_id" integer,
  	"board_members_id" integer,
  	"partners_id" integer,
  	"pages_id" integer,
  	"contact_submissions_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_job_resource_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_job_resource_links_locales" (
  	"label" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_board_notification_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"logo_alt_id" integer,
  	"contact_group_address" varchar,
  	"contact_group_phone" varchar,
  	"contact_group_email" varchar,
  	"seo_group_default_og_image_id" integer,
  	"submission_retention_months" numeric DEFAULT 12,
  	"expert_application_retention_months" numeric DEFAULT 12,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"org_name" varchar,
  	"tagline" varchar,
  	"contact_group_opening_hours" varchar,
  	"seo_group_default_title" varchar,
  	"seo_group_default_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "navigation_header_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_locales" ADD CONSTRAINT "news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v_locales" ADD CONSTRAINT "_news_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_locales" ADD CONSTRAINT "_events_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_locales" ADD CONSTRAINT "services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_parent_id_services_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_pillar_id_service_pillars_id_fk" FOREIGN KEY ("version_pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_locales" ADD CONSTRAINT "_services_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_pillars_locales" ADD CONSTRAINT "service_pillars_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guide_topics_locales" ADD CONSTRAINT "guide_topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guide_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guide_articles" ADD CONSTRAINT "guide_articles_topic_id_guide_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."guide_topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guide_articles" ADD CONSTRAINT "guide_articles_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guide_articles" ADD CONSTRAINT "guide_articles_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guide_articles_locales" ADD CONSTRAINT "guide_articles_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guide_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guide_articles_rels" ADD CONSTRAINT "guide_articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guide_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guide_articles_rels" ADD CONSTRAINT "guide_articles_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guide_articles_rels" ADD CONSTRAINT "guide_articles_rels_roadmaps_fk" FOREIGN KEY ("roadmaps_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guide_articles_rels" ADD CONSTRAINT "guide_articles_rels_experts_fk" FOREIGN KEY ("experts_id") REFERENCES "public"."experts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guide_articles_v" ADD CONSTRAINT "_guide_articles_v_parent_id_guide_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guide_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guide_articles_v" ADD CONSTRAINT "_guide_articles_v_version_topic_id_guide_topics_id_fk" FOREIGN KEY ("version_topic_id") REFERENCES "public"."guide_topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guide_articles_v" ADD CONSTRAINT "_guide_articles_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guide_articles_v" ADD CONSTRAINT "_guide_articles_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guide_articles_v_locales" ADD CONSTRAINT "_guide_articles_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guide_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guide_articles_v_rels" ADD CONSTRAINT "_guide_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_guide_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guide_articles_v_rels" ADD CONSTRAINT "_guide_articles_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guide_articles_v_rels" ADD CONSTRAINT "_guide_articles_v_rels_roadmaps_fk" FOREIGN KEY ("roadmaps_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guide_articles_v_rels" ADD CONSTRAINT "_guide_articles_v_rels_experts_fk" FOREIGN KEY ("experts_id") REFERENCES "public"."experts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roadmaps_steps_required_documents" ADD CONSTRAINT "roadmaps_steps_required_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."roadmaps_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roadmaps_steps_required_documents_locales" ADD CONSTRAINT "roadmaps_steps_required_documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."roadmaps_steps_required_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roadmaps_steps_links" ADD CONSTRAINT "roadmaps_steps_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."roadmaps_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roadmaps_steps_links_locales" ADD CONSTRAINT "roadmaps_steps_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."roadmaps_steps_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roadmaps_steps" ADD CONSTRAINT "roadmaps_steps_linked_guide_article_id_guide_articles_id_fk" FOREIGN KEY ("linked_guide_article_id") REFERENCES "public"."guide_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "roadmaps_steps" ADD CONSTRAINT "roadmaps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roadmaps_steps_locales" ADD CONSTRAINT "roadmaps_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."roadmaps_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "roadmaps_locales" ADD CONSTRAINT "roadmaps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roadmaps_v_version_steps_required_documents" ADD CONSTRAINT "_roadmaps_v_version_steps_required_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_roadmaps_v_version_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roadmaps_v_version_steps_required_documents_locales" ADD CONSTRAINT "_roadmaps_v_version_steps_required_documents_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_roadmaps_v_version_steps_required_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roadmaps_v_version_steps_links" ADD CONSTRAINT "_roadmaps_v_version_steps_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_roadmaps_v_version_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roadmaps_v_version_steps_links_locales" ADD CONSTRAINT "_roadmaps_v_version_steps_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_roadmaps_v_version_steps_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roadmaps_v_version_steps" ADD CONSTRAINT "_roadmaps_v_version_steps_linked_guide_article_id_guide_articles_id_fk" FOREIGN KEY ("linked_guide_article_id") REFERENCES "public"."guide_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_roadmaps_v_version_steps" ADD CONSTRAINT "_roadmaps_v_version_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_roadmaps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roadmaps_v_version_steps_locales" ADD CONSTRAINT "_roadmaps_v_version_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_roadmaps_v_version_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roadmaps_v" ADD CONSTRAINT "_roadmaps_v_parent_id_roadmaps_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roadmaps"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_roadmaps_v" ADD CONSTRAINT "_roadmaps_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_roadmaps_v_locales" ADD CONSTRAINT "_roadmaps_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_roadmaps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experts_languages" ADD CONSTRAINT "experts_languages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."experts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experts" ADD CONSTRAINT "experts_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experts_locales" ADD CONSTRAINT "experts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."experts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experts_rels" ADD CONSTRAINT "experts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."experts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experts_rels" ADD CONSTRAINT "experts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experts_v_version_languages" ADD CONSTRAINT "_experts_v_version_languages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_experts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experts_v" ADD CONSTRAINT "_experts_v_parent_id_experts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."experts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experts_v" ADD CONSTRAINT "_experts_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experts_v_locales" ADD CONSTRAINT "_experts_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_experts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experts_v_rels" ADD CONSTRAINT "_experts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_experts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experts_v_rels" ADD CONSTRAINT "_experts_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "board_members" ADD CONSTRAINT "board_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "board_members_locales" ADD CONSTRAINT "board_members_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."board_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_text" ADD CONSTRAINT "pages_blocks_image_text_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_text" ADD CONSTRAINT "pages_blocks_image_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_grid_cards" ADD CONSTRAINT "pages_blocks_card_grid_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_grid_cards" ADD CONSTRAINT "pages_blocks_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_grid" ADD CONSTRAINT "pages_blocks_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_stats" ADD CONSTRAINT "pages_blocks_stats_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats" ADD CONSTRAINT "pages_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_band" ADD CONSTRAINT "pages_blocks_cta_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_grid_logos" ADD CONSTRAINT "pages_blocks_logo_grid_logos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_grid_logos" ADD CONSTRAINT "pages_blocks_logo_grid_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_logo_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_grid" ADD CONSTRAINT "pages_blocks_logo_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline_items" ADD CONSTRAINT "pages_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline" ADD CONSTRAINT "pages_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_block" ADD CONSTRAINT "pages_blocks_contact_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_text" ADD CONSTRAINT "_pages_v_blocks_image_text_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_text" ADD CONSTRAINT "_pages_v_blocks_image_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_card_grid_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_grid" ADD CONSTRAINT "_pages_v_blocks_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_stats" ADD CONSTRAINT "_pages_v_blocks_stats_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats" ADD CONSTRAINT "_pages_v_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_band" ADD CONSTRAINT "_pages_v_blocks_cta_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_grid_logos" ADD CONSTRAINT "_pages_v_blocks_logo_grid_logos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_grid_logos" ADD CONSTRAINT "_pages_v_blocks_logo_grid_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_logo_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_grid" ADD CONSTRAINT "_pages_v_blocks_logo_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_items" ADD CONSTRAINT "_pages_v_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline" ADD CONSTRAINT "_pages_v_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_block" ADD CONSTRAINT "_pages_v_blocks_contact_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guide_topics_fk" FOREIGN KEY ("guide_topics_id") REFERENCES "public"."guide_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guide_articles_fk" FOREIGN KEY ("guide_articles_id") REFERENCES "public"."guide_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_roadmaps_fk" FOREIGN KEY ("roadmaps_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_experts_fk" FOREIGN KEY ("experts_id") REFERENCES "public"."experts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_board_members_fk" FOREIGN KEY ("board_members_id") REFERENCES "public"."board_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_submissions_fk" FOREIGN KEY ("contact_submissions_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_job_resource_links" ADD CONSTRAINT "site_settings_job_resource_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_job_resource_links_locales" ADD CONSTRAINT "site_settings_job_resource_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_job_resource_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_board_notification_emails" ADD CONSTRAINT "site_settings_board_notification_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_alt_id_media_id_fk" FOREIGN KEY ("logo_alt_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_seo_group_default_og_image_id_media_id_fk" FOREIGN KEY ("seo_group_default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_children" ADD CONSTRAINT "navigation_header_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header" ADD CONSTRAINT "navigation_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer" ADD CONSTRAINT "navigation_footer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "news_cover_image_idx" ON "news" USING btree ("cover_image_id");
  CREATE INDEX "news_category_idx" ON "news" USING btree ("category_id");
  CREATE INDEX "news_seo_seo_og_image_idx" ON "news" USING btree ("seo_og_image_id");
  CREATE INDEX "news_updated_at_idx" ON "news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "news" USING btree ("created_at");
  CREATE INDEX "news__status_idx" ON "news" USING btree ("_status");
  CREATE UNIQUE INDEX "news_locales_locale_parent_id_unique" ON "news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_news_v_parent_idx" ON "_news_v" USING btree ("parent_id");
  CREATE INDEX "_news_v_version_version_cover_image_idx" ON "_news_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_news_v_version_version_category_idx" ON "_news_v" USING btree ("version_category_id");
  CREATE INDEX "_news_v_version_seo_version_seo_og_image_idx" ON "_news_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_news_v_version_version_updated_at_idx" ON "_news_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_v_version_version_created_at_idx" ON "_news_v" USING btree ("version_created_at");
  CREATE INDEX "_news_v_version_version__status_idx" ON "_news_v" USING btree ("version__status");
  CREATE INDEX "_news_v_created_at_idx" ON "_news_v" USING btree ("created_at");
  CREATE INDEX "_news_v_updated_at_idx" ON "_news_v" USING btree ("updated_at");
  CREATE INDEX "_news_v_snapshot_idx" ON "_news_v" USING btree ("snapshot");
  CREATE INDEX "_news_v_published_locale_idx" ON "_news_v" USING btree ("published_locale");
  CREATE INDEX "_news_v_latest_idx" ON "_news_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_news_v_locales_locale_parent_id_unique" ON "_news_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_cover_image_idx" ON "events" USING btree ("cover_image_id");
  CREATE INDEX "events_category_idx" ON "events" USING btree ("category_id");
  CREATE INDEX "events_seo_seo_og_image_idx" ON "events" USING btree ("seo_og_image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_cover_image_idx" ON "_events_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_events_v_version_version_category_idx" ON "_events_v" USING btree ("version_category_id");
  CREATE INDEX "_events_v_version_seo_version_seo_og_image_idx" ON "_events_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_snapshot_idx" ON "_events_v" USING btree ("snapshot");
  CREATE INDEX "_events_v_published_locale_idx" ON "_events_v" USING btree ("published_locale");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_events_v_locales_locale_parent_id_unique" ON "_events_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_pillar_idx" ON "services" USING btree ("pillar_id");
  CREATE INDEX "services_image_idx" ON "services" USING btree ("image_id");
  CREATE INDEX "services_seo_seo_og_image_idx" ON "services" USING btree ("seo_og_image_id");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "services__status_idx" ON "services" USING btree ("_status");
  CREATE UNIQUE INDEX "services_locales_locale_parent_id_unique" ON "services_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_rels_order_idx" ON "services_rels" USING btree ("order");
  CREATE INDEX "services_rels_parent_idx" ON "services_rels" USING btree ("parent_id");
  CREATE INDEX "services_rels_path_idx" ON "services_rels" USING btree ("path");
  CREATE INDEX "services_rels_services_id_idx" ON "services_rels" USING btree ("services_id");
  CREATE INDEX "_services_v_parent_idx" ON "_services_v" USING btree ("parent_id");
  CREATE INDEX "_services_v_version_version_pillar_idx" ON "_services_v" USING btree ("version_pillar_id");
  CREATE INDEX "_services_v_version_version_image_idx" ON "_services_v" USING btree ("version_image_id");
  CREATE INDEX "_services_v_version_seo_version_seo_og_image_idx" ON "_services_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_services_v_version_version_updated_at_idx" ON "_services_v" USING btree ("version_updated_at");
  CREATE INDEX "_services_v_version_version_created_at_idx" ON "_services_v" USING btree ("version_created_at");
  CREATE INDEX "_services_v_version_version__status_idx" ON "_services_v" USING btree ("version__status");
  CREATE INDEX "_services_v_created_at_idx" ON "_services_v" USING btree ("created_at");
  CREATE INDEX "_services_v_updated_at_idx" ON "_services_v" USING btree ("updated_at");
  CREATE INDEX "_services_v_snapshot_idx" ON "_services_v" USING btree ("snapshot");
  CREATE INDEX "_services_v_published_locale_idx" ON "_services_v" USING btree ("published_locale");
  CREATE INDEX "_services_v_latest_idx" ON "_services_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_services_v_locales_locale_parent_id_unique" ON "_services_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_rels_order_idx" ON "_services_v_rels" USING btree ("order");
  CREATE INDEX "_services_v_rels_parent_idx" ON "_services_v_rels" USING btree ("parent_id");
  CREATE INDEX "_services_v_rels_path_idx" ON "_services_v_rels" USING btree ("path");
  CREATE INDEX "_services_v_rels_services_id_idx" ON "_services_v_rels" USING btree ("services_id");
  CREATE INDEX "service_pillars_updated_at_idx" ON "service_pillars" USING btree ("updated_at");
  CREATE INDEX "service_pillars_created_at_idx" ON "service_pillars" USING btree ("created_at");
  CREATE UNIQUE INDEX "service_pillars_locales_locale_parent_id_unique" ON "service_pillars_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guide_topics_updated_at_idx" ON "guide_topics" USING btree ("updated_at");
  CREATE INDEX "guide_topics_created_at_idx" ON "guide_topics" USING btree ("created_at");
  CREATE UNIQUE INDEX "guide_topics_locales_locale_parent_id_unique" ON "guide_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guide_articles_topic_idx" ON "guide_articles" USING btree ("topic_id");
  CREATE INDEX "guide_articles_cover_image_idx" ON "guide_articles" USING btree ("cover_image_id");
  CREATE INDEX "guide_articles_seo_seo_og_image_idx" ON "guide_articles" USING btree ("seo_og_image_id");
  CREATE INDEX "guide_articles_updated_at_idx" ON "guide_articles" USING btree ("updated_at");
  CREATE INDEX "guide_articles_created_at_idx" ON "guide_articles" USING btree ("created_at");
  CREATE INDEX "guide_articles__status_idx" ON "guide_articles" USING btree ("_status");
  CREATE UNIQUE INDEX "guide_articles_locales_locale_parent_id_unique" ON "guide_articles_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guide_articles_rels_order_idx" ON "guide_articles_rels" USING btree ("order");
  CREATE INDEX "guide_articles_rels_parent_idx" ON "guide_articles_rels" USING btree ("parent_id");
  CREATE INDEX "guide_articles_rels_path_idx" ON "guide_articles_rels" USING btree ("path");
  CREATE INDEX "guide_articles_rels_services_id_idx" ON "guide_articles_rels" USING btree ("services_id");
  CREATE INDEX "guide_articles_rels_roadmaps_id_idx" ON "guide_articles_rels" USING btree ("roadmaps_id");
  CREATE INDEX "guide_articles_rels_experts_id_idx" ON "guide_articles_rels" USING btree ("experts_id");
  CREATE INDEX "_guide_articles_v_parent_idx" ON "_guide_articles_v" USING btree ("parent_id");
  CREATE INDEX "_guide_articles_v_version_version_topic_idx" ON "_guide_articles_v" USING btree ("version_topic_id");
  CREATE INDEX "_guide_articles_v_version_version_cover_image_idx" ON "_guide_articles_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_guide_articles_v_version_seo_version_seo_og_image_idx" ON "_guide_articles_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_guide_articles_v_version_version_updated_at_idx" ON "_guide_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_guide_articles_v_version_version_created_at_idx" ON "_guide_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_guide_articles_v_version_version__status_idx" ON "_guide_articles_v" USING btree ("version__status");
  CREATE INDEX "_guide_articles_v_created_at_idx" ON "_guide_articles_v" USING btree ("created_at");
  CREATE INDEX "_guide_articles_v_updated_at_idx" ON "_guide_articles_v" USING btree ("updated_at");
  CREATE INDEX "_guide_articles_v_snapshot_idx" ON "_guide_articles_v" USING btree ("snapshot");
  CREATE INDEX "_guide_articles_v_published_locale_idx" ON "_guide_articles_v" USING btree ("published_locale");
  CREATE INDEX "_guide_articles_v_latest_idx" ON "_guide_articles_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_guide_articles_v_locales_locale_parent_id_unique" ON "_guide_articles_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guide_articles_v_rels_order_idx" ON "_guide_articles_v_rels" USING btree ("order");
  CREATE INDEX "_guide_articles_v_rels_parent_idx" ON "_guide_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guide_articles_v_rels_path_idx" ON "_guide_articles_v_rels" USING btree ("path");
  CREATE INDEX "_guide_articles_v_rels_services_id_idx" ON "_guide_articles_v_rels" USING btree ("services_id");
  CREATE INDEX "_guide_articles_v_rels_roadmaps_id_idx" ON "_guide_articles_v_rels" USING btree ("roadmaps_id");
  CREATE INDEX "_guide_articles_v_rels_experts_id_idx" ON "_guide_articles_v_rels" USING btree ("experts_id");
  CREATE INDEX "roadmaps_steps_required_documents_order_idx" ON "roadmaps_steps_required_documents" USING btree ("_order");
  CREATE INDEX "roadmaps_steps_required_documents_parent_id_idx" ON "roadmaps_steps_required_documents" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "roadmaps_steps_required_documents_locales_locale_parent_id_u" ON "roadmaps_steps_required_documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "roadmaps_steps_links_order_idx" ON "roadmaps_steps_links" USING btree ("_order");
  CREATE INDEX "roadmaps_steps_links_parent_id_idx" ON "roadmaps_steps_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "roadmaps_steps_links_locales_locale_parent_id_unique" ON "roadmaps_steps_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "roadmaps_steps_order_idx" ON "roadmaps_steps" USING btree ("_order");
  CREATE INDEX "roadmaps_steps_parent_id_idx" ON "roadmaps_steps" USING btree ("_parent_id");
  CREATE INDEX "roadmaps_steps_linked_guide_article_idx" ON "roadmaps_steps" USING btree ("linked_guide_article_id");
  CREATE UNIQUE INDEX "roadmaps_steps_locales_locale_parent_id_unique" ON "roadmaps_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "roadmaps_seo_seo_og_image_idx" ON "roadmaps" USING btree ("seo_og_image_id");
  CREATE INDEX "roadmaps_updated_at_idx" ON "roadmaps" USING btree ("updated_at");
  CREATE INDEX "roadmaps_created_at_idx" ON "roadmaps" USING btree ("created_at");
  CREATE INDEX "roadmaps__status_idx" ON "roadmaps" USING btree ("_status");
  CREATE UNIQUE INDEX "roadmaps_locales_locale_parent_id_unique" ON "roadmaps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_roadmaps_v_version_steps_required_documents_order_idx" ON "_roadmaps_v_version_steps_required_documents" USING btree ("_order");
  CREATE INDEX "_roadmaps_v_version_steps_required_documents_parent_id_idx" ON "_roadmaps_v_version_steps_required_documents" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_roadmaps_v_version_steps_required_documents_locales_locale_" ON "_roadmaps_v_version_steps_required_documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_roadmaps_v_version_steps_links_order_idx" ON "_roadmaps_v_version_steps_links" USING btree ("_order");
  CREATE INDEX "_roadmaps_v_version_steps_links_parent_id_idx" ON "_roadmaps_v_version_steps_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_roadmaps_v_version_steps_links_locales_locale_parent_id_uni" ON "_roadmaps_v_version_steps_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_roadmaps_v_version_steps_order_idx" ON "_roadmaps_v_version_steps" USING btree ("_order");
  CREATE INDEX "_roadmaps_v_version_steps_parent_id_idx" ON "_roadmaps_v_version_steps" USING btree ("_parent_id");
  CREATE INDEX "_roadmaps_v_version_steps_linked_guide_article_idx" ON "_roadmaps_v_version_steps" USING btree ("linked_guide_article_id");
  CREATE UNIQUE INDEX "_roadmaps_v_version_steps_locales_locale_parent_id_unique" ON "_roadmaps_v_version_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_roadmaps_v_parent_idx" ON "_roadmaps_v" USING btree ("parent_id");
  CREATE INDEX "_roadmaps_v_version_seo_version_seo_og_image_idx" ON "_roadmaps_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_roadmaps_v_version_version_updated_at_idx" ON "_roadmaps_v" USING btree ("version_updated_at");
  CREATE INDEX "_roadmaps_v_version_version_created_at_idx" ON "_roadmaps_v" USING btree ("version_created_at");
  CREATE INDEX "_roadmaps_v_version_version__status_idx" ON "_roadmaps_v" USING btree ("version__status");
  CREATE INDEX "_roadmaps_v_created_at_idx" ON "_roadmaps_v" USING btree ("created_at");
  CREATE INDEX "_roadmaps_v_updated_at_idx" ON "_roadmaps_v" USING btree ("updated_at");
  CREATE INDEX "_roadmaps_v_snapshot_idx" ON "_roadmaps_v" USING btree ("snapshot");
  CREATE INDEX "_roadmaps_v_published_locale_idx" ON "_roadmaps_v" USING btree ("published_locale");
  CREATE INDEX "_roadmaps_v_latest_idx" ON "_roadmaps_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_roadmaps_v_locales_locale_parent_id_unique" ON "_roadmaps_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "experts_languages_order_idx" ON "experts_languages" USING btree ("_order");
  CREATE INDEX "experts_languages_parent_id_idx" ON "experts_languages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "experts_slug_idx" ON "experts" USING btree ("slug");
  CREATE INDEX "experts_photo_idx" ON "experts" USING btree ("photo_id");
  CREATE INDEX "experts_updated_at_idx" ON "experts" USING btree ("updated_at");
  CREATE INDEX "experts_created_at_idx" ON "experts" USING btree ("created_at");
  CREATE INDEX "experts__status_idx" ON "experts" USING btree ("_status");
  CREATE UNIQUE INDEX "experts_locales_locale_parent_id_unique" ON "experts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "experts_rels_order_idx" ON "experts_rels" USING btree ("order");
  CREATE INDEX "experts_rels_parent_idx" ON "experts_rels" USING btree ("parent_id");
  CREATE INDEX "experts_rels_path_idx" ON "experts_rels" USING btree ("path");
  CREATE INDEX "experts_rels_categories_id_idx" ON "experts_rels" USING btree ("categories_id");
  CREATE INDEX "_experts_v_version_languages_order_idx" ON "_experts_v_version_languages" USING btree ("_order");
  CREATE INDEX "_experts_v_version_languages_parent_id_idx" ON "_experts_v_version_languages" USING btree ("_parent_id");
  CREATE INDEX "_experts_v_parent_idx" ON "_experts_v" USING btree ("parent_id");
  CREATE INDEX "_experts_v_version_version_slug_idx" ON "_experts_v" USING btree ("version_slug");
  CREATE INDEX "_experts_v_version_version_photo_idx" ON "_experts_v" USING btree ("version_photo_id");
  CREATE INDEX "_experts_v_version_version_updated_at_idx" ON "_experts_v" USING btree ("version_updated_at");
  CREATE INDEX "_experts_v_version_version_created_at_idx" ON "_experts_v" USING btree ("version_created_at");
  CREATE INDEX "_experts_v_version_version__status_idx" ON "_experts_v" USING btree ("version__status");
  CREATE INDEX "_experts_v_created_at_idx" ON "_experts_v" USING btree ("created_at");
  CREATE INDEX "_experts_v_updated_at_idx" ON "_experts_v" USING btree ("updated_at");
  CREATE INDEX "_experts_v_snapshot_idx" ON "_experts_v" USING btree ("snapshot");
  CREATE INDEX "_experts_v_published_locale_idx" ON "_experts_v" USING btree ("published_locale");
  CREATE INDEX "_experts_v_latest_idx" ON "_experts_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_experts_v_locales_locale_parent_id_unique" ON "_experts_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_experts_v_rels_order_idx" ON "_experts_v_rels" USING btree ("order");
  CREATE INDEX "_experts_v_rels_parent_idx" ON "_experts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_experts_v_rels_path_idx" ON "_experts_v_rels" USING btree ("path");
  CREATE INDEX "_experts_v_rels_categories_id_idx" ON "_experts_v_rels" USING btree ("categories_id");
  CREATE INDEX "board_members_photo_idx" ON "board_members" USING btree ("photo_id");
  CREATE INDEX "board_members_updated_at_idx" ON "board_members" USING btree ("updated_at");
  CREATE INDEX "board_members_created_at_idx" ON "board_members" USING btree ("created_at");
  CREATE UNIQUE INDEX "board_members_locales_locale_parent_id_unique" ON "board_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "partners_logo_idx" ON "partners" USING btree ("logo_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_locale_idx" ON "pages_blocks_hero" USING btree ("_locale");
  CREATE INDEX "pages_blocks_hero_image_idx" ON "pages_blocks_hero" USING btree ("image_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_rich_text_locale_idx" ON "pages_blocks_rich_text" USING btree ("_locale");
  CREATE INDEX "pages_blocks_image_text_order_idx" ON "pages_blocks_image_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_text_parent_id_idx" ON "pages_blocks_image_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_text_path_idx" ON "pages_blocks_image_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_text_locale_idx" ON "pages_blocks_image_text" USING btree ("_locale");
  CREATE INDEX "pages_blocks_image_text_image_idx" ON "pages_blocks_image_text" USING btree ("image_id");
  CREATE INDEX "pages_blocks_card_grid_cards_order_idx" ON "pages_blocks_card_grid_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_cards_parent_id_idx" ON "pages_blocks_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_cards_locale_idx" ON "pages_blocks_card_grid_cards" USING btree ("_locale");
  CREATE INDEX "pages_blocks_card_grid_cards_image_idx" ON "pages_blocks_card_grid_cards" USING btree ("image_id");
  CREATE INDEX "pages_blocks_card_grid_order_idx" ON "pages_blocks_card_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_parent_id_idx" ON "pages_blocks_card_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_path_idx" ON "pages_blocks_card_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_card_grid_locale_idx" ON "pages_blocks_card_grid" USING btree ("_locale");
  CREATE INDEX "pages_blocks_stats_stats_order_idx" ON "pages_blocks_stats_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_stats_parent_id_idx" ON "pages_blocks_stats_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_stats_locale_idx" ON "pages_blocks_stats_stats" USING btree ("_locale");
  CREATE INDEX "pages_blocks_stats_order_idx" ON "pages_blocks_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_parent_id_idx" ON "pages_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_path_idx" ON "pages_blocks_stats" USING btree ("_path");
  CREATE INDEX "pages_blocks_stats_locale_idx" ON "pages_blocks_stats" USING btree ("_locale");
  CREATE INDEX "pages_blocks_cta_band_order_idx" ON "pages_blocks_cta_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_band_parent_id_idx" ON "pages_blocks_cta_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_band_path_idx" ON "pages_blocks_cta_band" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_band_locale_idx" ON "pages_blocks_cta_band" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_items_locale_idx" ON "pages_blocks_faq_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_locale_idx" ON "pages_blocks_faq" USING btree ("_locale");
  CREATE INDEX "pages_blocks_logo_grid_logos_order_idx" ON "pages_blocks_logo_grid_logos" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_grid_logos_parent_id_idx" ON "pages_blocks_logo_grid_logos" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_grid_logos_locale_idx" ON "pages_blocks_logo_grid_logos" USING btree ("_locale");
  CREATE INDEX "pages_blocks_logo_grid_logos_image_idx" ON "pages_blocks_logo_grid_logos" USING btree ("image_id");
  CREATE INDEX "pages_blocks_logo_grid_order_idx" ON "pages_blocks_logo_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_grid_parent_id_idx" ON "pages_blocks_logo_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_grid_path_idx" ON "pages_blocks_logo_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_logo_grid_locale_idx" ON "pages_blocks_logo_grid" USING btree ("_locale");
  CREATE INDEX "pages_blocks_timeline_items_order_idx" ON "pages_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_items_parent_id_idx" ON "pages_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_items_locale_idx" ON "pages_blocks_timeline_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_timeline_order_idx" ON "pages_blocks_timeline" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_parent_id_idx" ON "pages_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_path_idx" ON "pages_blocks_timeline" USING btree ("_path");
  CREATE INDEX "pages_blocks_timeline_locale_idx" ON "pages_blocks_timeline" USING btree ("_locale");
  CREATE INDEX "pages_blocks_contact_block_order_idx" ON "pages_blocks_contact_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_block_parent_id_idx" ON "pages_blocks_contact_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_block_path_idx" ON "pages_blocks_contact_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_block_locale_idx" ON "pages_blocks_contact_block" USING btree ("_locale");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_locale_idx" ON "_pages_v_blocks_hero" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_hero_image_idx" ON "_pages_v_blocks_hero" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_rich_text_locale_idx" ON "_pages_v_blocks_rich_text" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_image_text_order_idx" ON "_pages_v_blocks_image_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_text_parent_id_idx" ON "_pages_v_blocks_image_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_text_path_idx" ON "_pages_v_blocks_image_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_text_locale_idx" ON "_pages_v_blocks_image_text" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_image_text_image_idx" ON "_pages_v_blocks_image_text" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_order_idx" ON "_pages_v_blocks_card_grid_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_parent_id_idx" ON "_pages_v_blocks_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_locale_idx" ON "_pages_v_blocks_card_grid_cards" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_image_idx" ON "_pages_v_blocks_card_grid_cards" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_card_grid_order_idx" ON "_pages_v_blocks_card_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_parent_id_idx" ON "_pages_v_blocks_card_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_path_idx" ON "_pages_v_blocks_card_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_card_grid_locale_idx" ON "_pages_v_blocks_card_grid" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_stats_stats_order_idx" ON "_pages_v_blocks_stats_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_stats_parent_id_idx" ON "_pages_v_blocks_stats_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_stats_locale_idx" ON "_pages_v_blocks_stats_stats" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_stats_order_idx" ON "_pages_v_blocks_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_parent_id_idx" ON "_pages_v_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_path_idx" ON "_pages_v_blocks_stats" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_stats_locale_idx" ON "_pages_v_blocks_stats" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_cta_band_order_idx" ON "_pages_v_blocks_cta_band" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_band_parent_id_idx" ON "_pages_v_blocks_cta_band" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_band_path_idx" ON "_pages_v_blocks_cta_band" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_band_locale_idx" ON "_pages_v_blocks_cta_band" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "_pages_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "_pages_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_items_locale_idx" ON "_pages_v_blocks_faq_items" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "_pages_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_locale_idx" ON "_pages_v_blocks_faq" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_logo_grid_logos_order_idx" ON "_pages_v_blocks_logo_grid_logos" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_grid_logos_parent_id_idx" ON "_pages_v_blocks_logo_grid_logos" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_grid_logos_locale_idx" ON "_pages_v_blocks_logo_grid_logos" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_logo_grid_logos_image_idx" ON "_pages_v_blocks_logo_grid_logos" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_logo_grid_order_idx" ON "_pages_v_blocks_logo_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_grid_parent_id_idx" ON "_pages_v_blocks_logo_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_grid_path_idx" ON "_pages_v_blocks_logo_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_logo_grid_locale_idx" ON "_pages_v_blocks_logo_grid" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_timeline_items_order_idx" ON "_pages_v_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_items_parent_id_idx" ON "_pages_v_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_items_locale_idx" ON "_pages_v_blocks_timeline_items" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_timeline_order_idx" ON "_pages_v_blocks_timeline" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_parent_id_idx" ON "_pages_v_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_path_idx" ON "_pages_v_blocks_timeline" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_timeline_locale_idx" ON "_pages_v_blocks_timeline" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_contact_block_order_idx" ON "_pages_v_blocks_contact_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_block_parent_id_idx" ON "_pages_v_blocks_contact_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_block_path_idx" ON "_pages_v_blocks_contact_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_contact_block_locale_idx" ON "_pages_v_blocks_contact_block" USING btree ("_locale");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_seo_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "contact_submissions_updated_at_idx" ON "contact_submissions" USING btree ("updated_at");
  CREATE INDEX "contact_submissions_created_at_idx" ON "contact_submissions" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_service_pillars_id_idx" ON "payload_locked_documents_rels" USING btree ("service_pillars_id");
  CREATE INDEX "payload_locked_documents_rels_guide_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("guide_topics_id");
  CREATE INDEX "payload_locked_documents_rels_guide_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("guide_articles_id");
  CREATE INDEX "payload_locked_documents_rels_roadmaps_id_idx" ON "payload_locked_documents_rels" USING btree ("roadmaps_id");
  CREATE INDEX "payload_locked_documents_rels_experts_id_idx" ON "payload_locked_documents_rels" USING btree ("experts_id");
  CREATE INDEX "payload_locked_documents_rels_board_members_id_idx" ON "payload_locked_documents_rels" USING btree ("board_members_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_contact_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_submissions_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_job_resource_links_order_idx" ON "site_settings_job_resource_links" USING btree ("_order");
  CREATE INDEX "site_settings_job_resource_links_parent_id_idx" ON "site_settings_job_resource_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_job_resource_links_locales_locale_parent_id_un" ON "site_settings_job_resource_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_board_notification_emails_order_idx" ON "site_settings_board_notification_emails" USING btree ("_order");
  CREATE INDEX "site_settings_board_notification_emails_parent_id_idx" ON "site_settings_board_notification_emails" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_logo_alt_idx" ON "site_settings" USING btree ("logo_alt_id");
  CREATE INDEX "site_settings_seo_group_seo_group_default_og_image_idx" ON "site_settings" USING btree ("seo_group_default_og_image_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_header_children_order_idx" ON "navigation_header_children" USING btree ("_order");
  CREATE INDEX "navigation_header_children_parent_id_idx" ON "navigation_header_children" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_children_locale_idx" ON "navigation_header_children" USING btree ("_locale");
  CREATE INDEX "navigation_header_order_idx" ON "navigation_header" USING btree ("_order");
  CREATE INDEX "navigation_header_parent_id_idx" ON "navigation_header" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_locale_idx" ON "navigation_header" USING btree ("_locale");
  CREATE INDEX "navigation_footer_order_idx" ON "navigation_footer" USING btree ("_order");
  CREATE INDEX "navigation_footer_parent_id_idx" ON "navigation_footer" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_locale_idx" ON "navigation_footer" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "news" CASCADE;
  DROP TABLE "news_locales" CASCADE;
  DROP TABLE "_news_v" CASCADE;
  DROP TABLE "_news_v_locales" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_locales" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "_events_v_locales" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_locales" CASCADE;
  DROP TABLE "services_rels" CASCADE;
  DROP TABLE "_services_v" CASCADE;
  DROP TABLE "_services_v_locales" CASCADE;
  DROP TABLE "_services_v_rels" CASCADE;
  DROP TABLE "service_pillars" CASCADE;
  DROP TABLE "service_pillars_locales" CASCADE;
  DROP TABLE "guide_topics" CASCADE;
  DROP TABLE "guide_topics_locales" CASCADE;
  DROP TABLE "guide_articles" CASCADE;
  DROP TABLE "guide_articles_locales" CASCADE;
  DROP TABLE "guide_articles_rels" CASCADE;
  DROP TABLE "_guide_articles_v" CASCADE;
  DROP TABLE "_guide_articles_v_locales" CASCADE;
  DROP TABLE "_guide_articles_v_rels" CASCADE;
  DROP TABLE "roadmaps_steps_required_documents" CASCADE;
  DROP TABLE "roadmaps_steps_required_documents_locales" CASCADE;
  DROP TABLE "roadmaps_steps_links" CASCADE;
  DROP TABLE "roadmaps_steps_links_locales" CASCADE;
  DROP TABLE "roadmaps_steps" CASCADE;
  DROP TABLE "roadmaps_steps_locales" CASCADE;
  DROP TABLE "roadmaps" CASCADE;
  DROP TABLE "roadmaps_locales" CASCADE;
  DROP TABLE "_roadmaps_v_version_steps_required_documents" CASCADE;
  DROP TABLE "_roadmaps_v_version_steps_required_documents_locales" CASCADE;
  DROP TABLE "_roadmaps_v_version_steps_links" CASCADE;
  DROP TABLE "_roadmaps_v_version_steps_links_locales" CASCADE;
  DROP TABLE "_roadmaps_v_version_steps" CASCADE;
  DROP TABLE "_roadmaps_v_version_steps_locales" CASCADE;
  DROP TABLE "_roadmaps_v" CASCADE;
  DROP TABLE "_roadmaps_v_locales" CASCADE;
  DROP TABLE "experts_languages" CASCADE;
  DROP TABLE "experts" CASCADE;
  DROP TABLE "experts_locales" CASCADE;
  DROP TABLE "experts_rels" CASCADE;
  DROP TABLE "_experts_v_version_languages" CASCADE;
  DROP TABLE "_experts_v" CASCADE;
  DROP TABLE "_experts_v_locales" CASCADE;
  DROP TABLE "_experts_v_rels" CASCADE;
  DROP TABLE "board_members" CASCADE;
  DROP TABLE "board_members_locales" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_image_text" CASCADE;
  DROP TABLE "pages_blocks_card_grid_cards" CASCADE;
  DROP TABLE "pages_blocks_card_grid" CASCADE;
  DROP TABLE "pages_blocks_stats_stats" CASCADE;
  DROP TABLE "pages_blocks_stats" CASCADE;
  DROP TABLE "pages_blocks_cta_band" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages_blocks_logo_grid_logos" CASCADE;
  DROP TABLE "pages_blocks_logo_grid" CASCADE;
  DROP TABLE "pages_blocks_timeline_items" CASCADE;
  DROP TABLE "pages_blocks_timeline" CASCADE;
  DROP TABLE "pages_blocks_contact_block" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_image_text" CASCADE;
  DROP TABLE "_pages_v_blocks_card_grid_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_card_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_stats" CASCADE;
  DROP TABLE "_pages_v_blocks_stats" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_band" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items" CASCADE;
  DROP TABLE "_pages_v_blocks_faq" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_grid_logos" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_items" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_block" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "contact_submissions" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_social_links" CASCADE;
  DROP TABLE "site_settings_job_resource_links" CASCADE;
  DROP TABLE "site_settings_job_resource_links_locales" CASCADE;
  DROP TABLE "site_settings_board_notification_emails" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "navigation_header_children" CASCADE;
  DROP TABLE "navigation_header" CASCADE;
  DROP TABLE "navigation_footer" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_categories_type";
  DROP TYPE "public"."enum_news_bundesland";
  DROP TYPE "public"."enum_news_review_status";
  DROP TYPE "public"."enum_news_status";
  DROP TYPE "public"."enum__news_v_version_bundesland";
  DROP TYPE "public"."enum__news_v_version_review_status";
  DROP TYPE "public"."enum__news_v_version_status";
  DROP TYPE "public"."enum__news_v_published_locale";
  DROP TYPE "public"."enum_events_bundesland";
  DROP TYPE "public"."enum_events_review_status";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_version_bundesland";
  DROP TYPE "public"."enum__events_v_version_review_status";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum__events_v_published_locale";
  DROP TYPE "public"."enum_services_review_status";
  DROP TYPE "public"."enum_services_status";
  DROP TYPE "public"."enum__services_v_version_review_status";
  DROP TYPE "public"."enum__services_v_version_status";
  DROP TYPE "public"."enum__services_v_published_locale";
  DROP TYPE "public"."enum_guide_articles_review_status";
  DROP TYPE "public"."enum_guide_articles_status";
  DROP TYPE "public"."enum__guide_articles_v_version_review_status";
  DROP TYPE "public"."enum__guide_articles_v_version_status";
  DROP TYPE "public"."enum__guide_articles_v_published_locale";
  DROP TYPE "public"."enum_roadmaps_review_status";
  DROP TYPE "public"."enum_roadmaps_status";
  DROP TYPE "public"."enum__roadmaps_v_version_review_status";
  DROP TYPE "public"."enum__roadmaps_v_version_status";
  DROP TYPE "public"."enum__roadmaps_v_published_locale";
  DROP TYPE "public"."enum_experts_verification_status";
  DROP TYPE "public"."enum_experts_review_status";
  DROP TYPE "public"."enum_experts_status";
  DROP TYPE "public"."enum__experts_v_version_verification_status";
  DROP TYPE "public"."enum__experts_v_version_review_status";
  DROP TYPE "public"."enum__experts_v_version_status";
  DROP TYPE "public"."enum__experts_v_published_locale";
  DROP TYPE "public"."enum_partners_type";
  DROP TYPE "public"."enum_pages_blocks_hero_variant";
  DROP TYPE "public"."enum_pages_blocks_rich_text_width";
  DROP TYPE "public"."enum_pages_blocks_image_text_image_position";
  DROP TYPE "public"."enum_pages_blocks_card_grid_columns";
  DROP TYPE "public"."enum_pages_blocks_stats_variant";
  DROP TYPE "public"."enum_pages_blocks_cta_band_variant";
  DROP TYPE "public"."enum_pages_review_status";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_hero_variant";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_width";
  DROP TYPE "public"."enum__pages_v_blocks_image_text_image_position";
  DROP TYPE "public"."enum__pages_v_blocks_card_grid_columns";
  DROP TYPE "public"."enum__pages_v_blocks_stats_variant";
  DROP TYPE "public"."enum__pages_v_blocks_cta_band_variant";
  DROP TYPE "public"."enum__pages_v_version_review_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_contact_submissions_locale";
  DROP TYPE "public"."enum_contact_submissions_status";
  DROP TYPE "public"."enum_site_settings_social_links_platform";`)
}
