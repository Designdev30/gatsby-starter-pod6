#*************************
# VARIABLES
#*************************
FIND= find
SRCDIR ?=./pub/
EXTRACTDIR= $(SRCDIR)/extract
DOCDIR ?=$(SRCDIR)
POD6DOC=./bin/pod6json
POD6JS=node ./bin/pod6js
POD6EXTRACT=node ./bin/extract-notes.js

DSTDIR ?=./pub.all

# ****************************************************************
# * some things we can figure out here, so we shouldn't 
# * have to mess with the settings all the time
# ****************************************************************

# the sourcefiles
PODFILES = $(shell ${FIND} ${DOCDIR} -iname '*.pod6' -or -iname '*.pod6' 2>/dev/null)
SRCFILES = $(PODFILES)

#JS_TARGETS = $(addsuffix .config.js, $(basename $(notdir $(SRCFILES))))
JS_TARGETS = $(addsuffix .config.json, $(SRCFILES))
COMPONETS_TARGETS = $(addsuffix .js, $(basename $(notdir $(SRCFILES))))

$(JS_TARGETS): SRC = $(basename $(basename $@))
$(JS_TARGETS): SRC_PATH = $(dir $@)
$(JS_TARGETS): DST_PATH = $(addprefix ./pub.all/, $(subst /,-,$@))
$(JS_TARGETS): DST_JSPATH = $(addprefix ./pub.all/, $(addsuffix .js, $(subst /,-,$(basename $(basename $@)))))
#$(JS_TARGETS): ORIG = $(filter %/${BASE}.pod,${SRCFILES})

TEST_TARGETS = $(addsuffix .config.json1, $(SRCFILES))
$(TEST_TARGETS): SRC = $(basename $(basename $@))
$(TEST_TARGETS): SRC_PATH = $(dir $@)
$(TEST_TARGETS): DST_PATH = $(addprefix ./pub.all/, $(subst /,-,$@))
$(TEST_TARGETS): DST_JSPATH = $(addprefix ./pub.all/, $(addsuffix .js, $(subst /,-,$(basename $(basename $@)))))

.PHONY: clea

all: $(JS_TARGETS)

$(JS_TARGETS):
	@echo TARGET BASE: ${SRC_PATH} // ${DST_PATH} $@ ${SRC} ${DST_JSPATH}
	$(POD6JS) --doctype json --jsreact=${DST_JSPATH} --images_prefix ${SRC_PATH} < ${SRC} >${DST_PATH} 


extract-items.done:  $(EXTRACTDIR)
	@echo EXTARCT PUBLISHED ITEMS into $(EXTRACTDIR)
	echo  $(SRCFILES) | xargs -P 1 -n 1 sh -c '$(POD6EXTRACT) -f $$0 -d $(EXTRACTDIR)'
	touch $@ 

$(EXTRACTDIR):
	-@mkdir -p $@ > /dev/null 2>&1

book_preface.xml:
	@echo TARGET BASE: ${BASE} ${ORIG}
	$(POD6DOC) -doctype preface ${ORIG} > $@ 

test: $(TEST_TARGETS)

$(TEST_TARGETS):
	@echo test ${SRC}
	$(POD6DOC) --doctype js --images_prefix ${SRC_PATH} < ${SRC} >/dev/null

clean: 
	$(RM) -rf $(DSTDIR)/*.bak $(DSTDIR)/*.js $(DSTDIR)/*.xml $(DSTDIR)/*.json extract-items.done $(EXTRACTDIR)
