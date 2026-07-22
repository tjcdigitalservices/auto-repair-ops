-- Clear leftover SAY / old brand asset paths so login uses neutral tenant defaults
-- (or each tenant's uploaded business logo via app enrichment).

update public.tenant_branding
set
  logo_path = case
    when logo_path is null then null
    when lower(logo_path) ~ '(say-auto-care|say_auto|/brand/say|say-logo|say-shield|website-official-logo)'
      then null
    else logo_path
  end,
  logo_tight_path = case
    when logo_tight_path is null then null
    when lower(logo_tight_path) ~ '(say-auto-care|say_auto|/brand/say|say-logo|say-shield|website-official-logo)'
      then null
    else logo_tight_path
  end,
  mark_path = case
    when mark_path is null then null
    when lower(mark_path) ~ '(say-auto-care|say_auto|/brand/say|say-logo|say-shield|website-official-logo)'
      then null
    else mark_path
  end,
  favicon_path = case
    when favicon_path is null then null
    when lower(favicon_path) ~ '(say-auto-care|say_auto|/brand/say|say-logo|say-shield|website-official-logo)'
      then null
    else favicon_path
  end,
  login_background_path = case
    when login_background_path is null then null
    when lower(login_background_path) ~ '(say-auto-care|say_auto|/brand/|say-logo|say-shield|website-official-logo)'
      then null
    when login_background_path like '/tenants/_default/%'
      then null
    else login_background_path
  end,
  hero_background_path = case
    when hero_background_path is null then null
    when lower(hero_background_path) ~ '(say-auto-care|say_auto|/brand/|say-logo|say-shield|website-official-logo)'
      then null
    when hero_background_path like '/tenants/_default/%'
      then null
    else hero_background_path
  end,
  feature_background_path = case
    when feature_background_path is null then null
    when lower(feature_background_path) ~ '(say-auto-care|say_auto|/brand/|say-logo|say-shield|website-official-logo)'
      then null
    when feature_background_path like '/tenants/_default/%'
      then null
    else feature_background_path
  end;
