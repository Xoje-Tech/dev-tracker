#!/usr/bin/env bash
# init.sh — Verificación e inicialización del entorno
#
# Este script lo ejecuta el agente al COMENZAR una sesión y antes de
# declarar cualquier tarea como `done`. Si falla, la sesión no debe avanzar.

set -u
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()    { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail()  { printf "${RED}[FAIL]${NC}  %s\n" "$1"; }

EXIT_CODE=0

echo "── 1. Verificando entorno básico ──────────────────────"

# Verificar que las herramientas esenciales estén disponibles
for cmd in node pnpm git; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "$cmd no está instalado"
    EXIT_CODE=1
  else
    ok "$cmd disponible -> $($cmd --version | head -n 1)"
  fi
done

echo ""
echo "── 2. Verificando archivos base del arnés ──────────────"

for f in AGENTS.md CHECKPOINTS.md progress/current.md progress/history.md; do
  if [ ! -f "$f" ]; then
    fail "Falta archivo base del arnés: $f"
    EXIT_CODE=1
  else
    ok "Existe $f"
  fi
done

echo ""
echo "── 3. Instalando dependencias si es necesario ──────────"

if [ -f "package.json" ]; then
  if [ ! -d "node_modules" ]; then
    warn "node_modules no existe. Instalando dependencias..."
    pnpm install
  else
    ok "node_modules detectado"
  fi
else
  warn "package.json no detectado en la raíz"
fi

echo ""
echo "── 4. Ejecutando verificación de tipos y linter ────────"

if grep -q "typecheck" package.json 2>/dev/null; then
  if pnpm typecheck; then
    ok "Typecheck completado sin errores"
  else
    fail "Errores de tipos detectados"
    EXIT_CODE=1
  fi
else
  warn "No se detectó script 'typecheck' en package.json"
fi

echo ""
echo "── 5. Ejecutando suite de pruebas ─────────────────────"

if grep -q "\"test\"" package.json 2>/dev/null; then
  if grep -q "\"test\":.*run" package.json 2>/dev/null; then
    TEST_CMD="pnpm test"
  else
    TEST_CMD="pnpm test -- run"
  fi
  
  if $TEST_CMD; then
    ok "Todos los tests pasan con éxito"
  else
    fail "Hay tests rotos en la suite"
    EXIT_CODE=1
  fi
else
  warn "No se detectó script 'test' en package.json"
fi

echo ""

echo ""
echo "── Verificando Receipt-Driven Development (RDD) ──"

RDD_RED='\033[0;31m'
RDD_GREEN='\033[0;32m'
RDD_YELLOW='\033[0;33m'
RDD_NC='\033[0m'

rdd_ok()   { printf "${RDD_GREEN}[OK]${RDD_NC}    %s\n" "$1"; }
rdd_warn() { printf "${RDD_YELLOW}[WARN]${RDD_NC}  %s\n" "$1"; }
rdd_fail() { printf "${RDD_RED}[FAIL]${RDD_NC}  %s\n" "$1"; }

if ! command -v gentle-ai >/dev/null 2>&1; then
  rdd_warn "gentle-ai CLI no está instalado o no está disponible en el PATH."
  rdd_warn "Para instalarlo: go install github.com/gentleman-programming/gentle-ai/cmd/gentle-ai@latest"
else
  rdd_ok "gentle-ai disponible -> $(gentle-ai --version 2>&1 | head -n 1)"

  # Verificar hooks Husky versionados (gate RDD migrado desde .git/hooks/pre-push)
  if [ -d ".git" ]; then
    if [ -f ".husky/pre-push" ]; then
      # Asegurar que husky haya instalado sus hooks internos (v9 via core.hooksPath)
      if [ ! -d ".husky/_" ] && command -v pnpm >/dev/null 2>&1; then
        rdd_warn "Hooks .husky presentes pero no instalados. Ejecutando pnpm exec husky..."
        pnpm exec husky
      fi
      if grep -q "gentle-ai review validate" ".husky/pre-push" 2>/dev/null; then
        rdd_ok "Hooks Husky versionados (.husky/) con gate RDD activo"
      else
        rdd_warn ".husky/pre-push no contiene el gate RDD. Revisa la migración."
      fi
    else
      rdd_warn "Hooks Husky no detectados. Ejecuta: pnpm install (prepare instala .husky/)"
    fi
  else
    rdd_warn "No se detectó el directorio .git. Saltando configuración de hooks."
  fi

  # Comprobar estado de SDD para evitar ambigüedades si jq está disponible
  if command -v jq >/dev/null 2>&1; then
    SDD_STATUS=$(gentle-ai sdd-status --json 2>/dev/null)
    if [ $? -eq 0 ]; then
      if echo "$SDD_STATUS" | grep -q "selection is ambiguous"; then
        AMBIGUOUS_CHANGES=$(echo "$SDD_STATUS" | jq -r '.blockedReasons[]' 2>/dev/null)
        rdd_fail "Hay ambigüedad en la selección de cambios de SDD:"
        rdd_fail "  $AMBIGUOUS_CHANGES"
        rdd_fail "Para resolverlo, seleccione un cambio activo con: gentle-ai sdd-status <change-name>"
        exit 1
      else
        ACTIVE_CHANGE=$(echo "$SDD_STATUS" | jq -r '.changeName' 2>/dev/null)
        if [ "$ACTIVE_CHANGE" != "null" ] && [ ! -z "$ACTIVE_CHANGE" ]; then
          rdd_ok "Cambio de SDD activo seleccionado: $ACTIVE_CHANGE"
        else
          rdd_ok "Estructura de SDD lista (sin cambios activos seleccionados)"
        fi
      fi
    else
      rdd_warn "No se pudo comprobar el estado de SDD con gentle-ai"
    fi
  else
    rdd_warn "jq no está instalado. No se puede comprobar el estado de SDD de forma estructurada."
  fi
fi

echo ""
echo "── 7. Resumen de salud del repositorio ──────────────────"

if [ $EXIT_CODE -eq 0 ]; then
  ok "Entorno listo y saludable. Podés empezar a trabajar."
else
  fail "Entorno NO saludable. Resuelve los errores antes de continuar."
fi

exit $EXIT_CODE
