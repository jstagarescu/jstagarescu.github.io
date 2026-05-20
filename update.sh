#!/bin/sh
tar --exclude=site.tar.gz --exclude=update.sh -czvf site.tar.gz *
hut pages publish -d jstagarescu.srht.site site.tar.gz
hut pages publish -d stagarescu.com site.tar.gz
echo 'done'
