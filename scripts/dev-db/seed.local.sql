-- Local dev demo data (not committed). Populates providers, one production
-- cluster run, clusters and articles across all categories so the home page,
-- category pages, provider pages and voting flow can be exercised locally.

TRUNCATE article_social_post, article_cluster, vote, article, social_post,
  cluster_v2, cluster_run, moss_data, cluster, news_provider RESTART IDENTITY CASCADE;

INSERT INTO news_provider (key, name, url, rank, bias_rating) VALUES
  ('rtvslo',  'RTV SLO',   'https://www.rtvslo.si',   0, 'center'),
  ('delo',    'Delo',      'https://www.delo.si',     1, 'center-left'),
  ('24ur',    '24ur',      'https://www.24ur.com',    2, 'center-right'),
  ('nova24',  'Nova24TV',  'https://nova24tv.si',     3, 'right'),
  ('mladina', 'Mladina',   'https://www.mladina.si',  4, 'left');

DO $$
DECLARE
  run_id int;
  cats text[] := ARRAY['politika','gospodarstvo','kriminal','lokalno','sport',
                       'tehnologija-znanost','kultura','zdravje','okolje'];
  cat text;
  c int;
  cid int;
  aid int;
  providers text[] := ARRAY['rtvslo','delo','24ur','nova24','mladina'];
  p text;
  pidx int;
BEGIN
  INSERT INTO cluster_run (algo_version, is_production, created_at)
    VALUES ('v1-local', true, now()) RETURNING id INTO run_id;

  FOREACH cat IN ARRAY cats LOOP
    FOR c IN 1..3 LOOP
      INSERT INTO cluster_v2 (title, slug, created_at, run_id)
        VALUES (
          initcap(cat) || ' - glavna zgodba ' || c,
          cat || '-zgodba-' || c || '-' || run_id,
          now(), run_id
        ) RETURNING id INTO cid;

      FOR pidx IN 1..3 LOOP
        p := providers[pidx];
        INSERT INTO article
          (url, title, published_at, embedding, news_provider_key, categories,
           llm_rank, image_urls, summary, deck, author)
          VALUES (
            'https://example.com/' || cat || '/' || c || '/' || pidx || '/' || run_id,
            initcap(cat) || ' novica ' || c || ' (' || p || ')',
            now() - (c * pidx || ' hours')::interval,
            ARRAY[0.1,0.2,0.3]::double precision[],
            p,
            ARRAY[cat]::varchar[],
            10 - c,
            ARRAY['https://images.vidik.si/stock.jpg']::varchar[],
            'Kratek povzetek novice za lokalni razvoj in testiranje.',
            'Podnaslov novice.',
            'Uredništvo'
          ) RETURNING id INTO aid;

        INSERT INTO article_cluster (article_id, cluster_id, run_id)
          VALUES (aid, cid, run_id);
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

SELECT
  (SELECT count(*) FROM news_provider) AS providers,
  (SELECT count(*) FROM cluster_v2)    AS clusters,
  (SELECT count(*) FROM article)       AS articles,
  (SELECT count(*) FROM article_cluster) AS article_clusters;
