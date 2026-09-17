-- ═══════════════════════════════════════════════════════════════════
-- `get_feed` calculait l'âge de l'auteur depuis `birthdate`. Cette
-- colonne n'est plus lisible, et `get_feed` est SECURITY INVOKER : elle
-- échouerait désormais avec « permission denied for column birthdate ».
--
-- Elle ne s'en sert que pour AFFICHER l'âge, jamais pour filtrer. La
-- colonne `age` suffit donc — et elle est meilleure ici, puisqu'elle
-- respecte « masquer mon âge », ce que le calcul depuis birthdate
-- ignorait.
--
-- La substitution est faite sur la définition existante plutôt que par
-- réécriture complète, pour ne pas risquer d'altérer par recopie une
-- fonction longue et déjà mesurée. Elle est vérifiée : si le motif n'est
-- pas trouvé, la migration échoue au lieu de passer silencieusement.
-- On ne touche NI à SECURITY INVOKER NI à l'absence de `SET search_path`,
-- qui est un choix mesuré (la clause empêche l'inlining, ~2,5x plus cher).
-- ═══════════════════════════════════════════════════════════════════

do $$
declare
  definition_avant text;
  definition_apres text;
begin
  select pg_get_functiondef(p.oid) into definition_avant
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'get_feed';

  if definition_avant is null then
    raise exception 'get_feed introuvable';
  end if;

  definition_apres := regexp_replace(
    definition_avant,
    'case when p\.birthdate is not null\s+then extract\(year from age\(p\.birthdate\)\)::integer\s+else p\.age end',
    'p.age',
    'g');

  if definition_apres = definition_avant then
    raise exception 'Le calcul de l''âge depuis birthdate n''a pas été trouvé dans get_feed : '
                    'la fonction a changé, cette migration doit être revue.';
  end if;

  if definition_apres ~ 'birthdate' then
    raise exception 'get_feed référence encore birthdate après substitution.';
  end if;

  execute definition_apres;
end $$;
